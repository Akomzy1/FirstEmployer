// GATE: verified-green is earned, never decorative (CLAUDE.md §3 / testing
// gate 8). Mechanical proxy: a RATCHET — the per-file count of verified-green
// token usages is pinned in this file's allowlist. Any new usage fails the gate
// until a human reviews it IS a legally-true state or primary CTA and updates
// the allowlist deliberately (that review is the control).
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const TOKEN = /verified-green/g;
const SCAN_DIRS = ["app", "components", "lib"];

// file -> allowed count. Regenerate a candidate list with: node scripts/gates/decorative-green.mjs --print
const ALLOWLIST_PATH = "scripts/gates/decorative-green.allowlist.json";

const counts = new Map();
function scan(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f).replaceAll("\\", "/");
    if (statSync(p).isDirectory()) { scan(p); continue; }
    if (!/\.(ts|tsx|css)$/.test(f)) continue;
    const n = (readFileSync(p, "utf8").match(TOKEN) ?? []).length;
    if (n > 0) counts.set(p, n);
  }
}
for (const d of SCAN_DIRS) scan(d);

if (process.argv.includes("--print")) {
  console.log(JSON.stringify(Object.fromEntries([...counts.entries()].sort()), null, 2));
  process.exit(0);
}

const allow = JSON.parse(readFileSync(ALLOWLIST_PATH, "utf8"));
let failures = [];
for (const [file, n] of counts) {
  const allowed = allow[file] ?? 0;
  if (n > allowed) failures.push(`${file}: ${n} verified-green usages (allowlist: ${allowed}) — review that every use is a legally-true state or primary CTA, then update the allowlist`);
}
if (failures.length) {
  console.error("DECORATIVE-GREEN GATE FAILED:");
  for (const f of failures) console.error("  " + f);
  process.exit(1);
}
console.log(`decorative-green gate: CLEAN (${counts.size} files, all within the reviewed allowlist)`);
