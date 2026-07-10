// Sanity-checks the hosted Supabase project: schema present (through migration
// 0013), config seeded, demo tenants seeded, RLS reading correctly. Read-only.
// Usage: node scripts/db/verify.mjs
//
// Demo-data checks assert the canonical rows EXIST rather than exact counts —
// the hosted project also carries throwaway businesses from P03-era e2e runs
// (reported as a WARN, never a failure).

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const svc = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon = createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });

let failures = 0;
function check(label, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? "  — " + detail : ""}`);
  if (!ok) failures++;
}

// --- base schema + seed (0001–0010) ---

const cfg = await svc.from("config_versions").select("label, status, values").order("label");
check("config_versions seeded (2026.1, 2026.2)",
  !cfg.error && cfg.data?.map((r) => r.label).join(",") === "2026.1,2026.2",
  cfg.error?.message ?? cfg.data?.map((r) => r.label).join(","));

const CANONICAL = ["DO Plumbing & Heating Ltd", "Bright Lights Salon"];
const biz = await svc.from("businesses").select("name");
const names = biz.data?.map((r) => r.name) ?? [];
check("canonical demo businesses seeded",
  !biz.error && CANONICAL.every((n) => names.includes(n)),
  biz.error?.message ?? CANONICAL.filter((n) => names.includes(n)).join(" | "));
const strays = names.filter((n) => !CANONICAL.includes(n));
if (strays.length) console.log(`WARN  ${strays.length} non-canonical businesses (P03 e2e residue) — e.g. ${strays.slice(0, 3).join(", ")}`);

const liam = await svc.from("employees").select("pay_amount, is_apprentice, businesses!inner(name)")
  .eq("full_name", "Liam Carter").eq("businesses.name", CANONICAL[0]);
check("Liam Carter seeded (apprentice, £8.00, DO Plumbing)",
  !liam.error && liam.data?.some((r) => Number(r.pay_amount) === 8 && r.is_apprentice === true),
  liam.error?.message ?? `${liam.data?.length ?? 0} row(s)`);

// --- post-P03 objects (0011–0013 + refreshed seed) ---

const stripeCol = await svc.from("businesses").select("stripe_customer_id").limit(1);
check("0011: businesses.stripe_customer_id exists", !stripeCol.error, stripeCol.error?.message);

const leads = await svc.from("marketing_leads").select("id").limit(1);
check("0012: marketing_leads table exists", !leads.error, leads.error?.message);

const feedback = await svc.from("feedback").select("id").limit(1);
check("0013: feedback table exists", !feedback.error, feedback.error?.message);

const monitor = await svc.from("monitor_findings").select("id").limit(1);
check("0013: monitor_findings table exists", !monitor.error, monitor.error?.message);

// Function probes: call with values that trip the function's own guards —
// proves the function exists without mutating anything.
const NIL = "00000000-0000-0000-0000-000000000000";
const del = await svc.rpc("delete_account_with_retention", { p_business_id: NIL });
check("0011: delete_account_with_retention exists (guard fired)",
  del.error != null && !/could not find|does not exist|schema cache/i.test(del.error.message),
  del.error?.message ?? "no error — unexpected");

const pub = await svc.rpc("publish_config_version", { p_version_id: NIL, p_audit_note: "verify probe", p_actor_id: NIL, p_actor_email: "verify@probe.invalid" });
check("0013: publish_config_version exists (guard fired)",
  pub.error != null && !/could not find|does not exist|schema cache/i.test(pub.error.message),
  pub.error?.message ?? "no error — unexpected");

const live = cfg.data?.find((r) => r.label === "2026.2");
check("seed: 2026.2 has the ni block (employment_allowance)",
  live?.values?.ni?.employment_allowance != null,
  live ? `ni.employment_allowance = ${live.values?.ni?.employment_allowance ?? "MISSING"}` : "2026.2 not found");

// --- RLS from the anon (logged-out) perspective ---

const anonBiz = await anon.from("businesses").select("id");
check("anon sees zero businesses (RLS on, no session)",
  !anonBiz.error && (anonBiz.data?.length ?? 0) === 0,
  anonBiz.error?.message ?? `saw ${anonBiz.data?.length}`);

const anonCfg = await anon.from("config_versions").select("label");
check("anon can read config_versions (global statutory data)",
  !anonCfg.error && (anonCfg.data?.length ?? 0) === 2,
  anonCfg.error?.message ?? `saw ${anonCfg.data?.length}`);

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
