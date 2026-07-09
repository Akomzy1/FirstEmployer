// Applies a .sql file to the hosted Supabase project via the Management API
// (HTTPS) — the reliable transport on networks that block the Postgres port.
//
// Usage: node scripts/db/apply-sql.mjs <path-to-sql> [<path-to-sql> ...]
// Requires SUPABASE_ACCESS_TOKEN (a Personal Access Token, sbp_...) and
// NEXT_PUBLIC_SUPABASE_URL in .env.local.

import { readFileSync } from "node:fs";

function loadEnv() {
  const env = {};
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

const env = loadEnv();
const token = env.SUPABASE_ACCESS_TOKEN;
const url = env.NEXT_PUBLIC_SUPABASE_URL;
if (!token) {
  console.error("Missing SUPABASE_ACCESS_TOKEN in .env.local (a Personal Access Token, sbp_...).");
  process.exit(2);
}
const ref = new URL(url).host.split(".")[0];

async function runQuery(sql) {
  const resp = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${text.slice(0, 500)}`);
  return text;
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("No SQL files given.");
  process.exit(2);
}

for (const f of files) {
  const sql = readFileSync(f, "utf8");
  process.stdout.write(`Applying ${f} ... `);
  try {
    await runQuery(sql);
    console.log("ok");
  } catch (e) {
    console.log("FAILED");
    console.error(e.message);
    process.exit(1);
  }
}

// Ask PostgREST to reload its schema cache so new tables are exposed immediately.
try {
  await runQuery("notify pgrst, 'reload schema';");
  console.log("Schema cache reload requested.");
} catch {
  /* non-fatal */
}
console.log("Done.");
