// GATE: secrets audit (P16 security pass). No live keys, service-role JWTs, or
// personal access tokens committed anywhere in the source tree.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const PATTERNS = [
  [/sk_live_[A-Za-z0-9]{8,}/, "Stripe live secret key"],
  [/sk_test_[A-Za-z0-9]{8,}/, "Stripe test secret key"],
  [/whsec_[A-Za-z0-9]{8,}/, "Stripe webhook secret"],
  [/re_[A-Za-z0-9]{20,}/, "Resend API key"],
  [/sk-ant-[A-Za-z0-9-]{10,}/, "Anthropic API key"],
  [/eyJhbGciOiJ[A-Za-z0-9_-]{40,}/, "JWT (possible service-role key)"],
  [/sbp_[A-Za-z0-9]{20,}/, "Supabase personal access token"],
  [/postgres(ql)?:\/\/[^ \n"']*:[^ \n"']*@/, "database URL with password"],
];
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "design"]);
const SKIP_FILES = [".env.local", ".env"];

let failures = [];
function scan(dir) {
  for (const f of readdirSync(dir)) {
    if (SKIP_DIRS.has(f)) continue;
    const p = join(dir, f);
    if (statSync(p).isDirectory()) { scan(p); continue; }
    if (SKIP_FILES.includes(f)) continue; // gitignored; never committed
    if (/\.(png|jpg|svg|woff2|pdf|ico)$/.test(f)) continue;
    let src;
    try { src = readFileSync(p, "utf8"); } catch { continue; }
    for (const [re, label] of PATTERNS) {
      if (re.test(src)) failures.push(`${p}: possible ${label}`);
    }
  }
}
scan(".");
if (failures.length) {
  console.error("SECRETS GATE FAILED:");
  for (const f of failures) console.error("  " + f);
  process.exit(1);
}
console.log("secrets gate: CLEAN");
