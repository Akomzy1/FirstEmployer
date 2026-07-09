// Sanity-checks the hosted Supabase project: schema present, config seeded,
// demo tenants seeded, RLS reading correctly. Read-only.
// Usage: node scripts/db/verify.mjs

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

const cfg = await svc.from("config_versions").select("label").order("label");
check("config_versions seeded (2026.1, 2026.2)",
  !cfg.error && cfg.data?.map((r) => r.label).join(",") === "2026.1,2026.2",
  cfg.error?.message ?? cfg.data?.map((r) => r.label).join(","));

const biz = await svc.from("businesses").select("name").order("name");
check("two demo businesses seeded",
  !biz.error && biz.data?.length === 2,
  biz.error?.message ?? biz.data?.map((r) => r.name).join(" | "));

const liam = await svc.from("employees").select("full_name, pay_amount, is_apprentice").eq("full_name", "Liam Carter").single();
check("Liam Carter seeded (apprentice, £8.00)",
  !liam.error && Number(liam.data?.pay_amount) === 8 && liam.data?.is_apprentice === true,
  liam.error?.message);

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
