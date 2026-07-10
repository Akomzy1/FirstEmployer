// GATE: no statutory rate literal outside config seeds, tests, fixtures, and
// the prototype exports (CLAUDE.md Rule 4 / testing gate 8).
// Run: node scripts/gates/statutory-literals.mjs
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, sep } from "node:path";

// The canonical rates (2026.1 + 2026.2) and key thresholds, as literal patterns.
const PATTERNS = [
  /12\.71/, /12\.21/, /10\.85/, /\b7\.55\b/, /118\.75/,
  /£45,000|£60,000/, /£6,240|£50,270/, /£10,500\b/,
];
const SCAN_DIRS = ["app", "components", "lib", "content"];
const ALLOW = [
  `lib${sep}config${sep}versions.json`,   // the config seed itself
  ".test.",                               // test fixtures may pin values
  `content${sep}guidance`,                // corpus is token-checked separately (no £ allowed at all — see below)
];

let failures = [];
function scan(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) { scan(p); continue; }
    if (!/\.(ts|tsx|md|json|css)$/.test(f)) continue;
    if (ALLOW.some((a) => p.includes(a))) continue;
    const src = readFileSync(p, "utf8");
    for (const re of PATTERNS) {
      const m = src.match(re);
      if (m) failures.push(`${p}: literal "${m[0]}"`);
    }
  }
}
for (const d of SCAN_DIRS) scan(d);

// The guidance corpus + marketing content must carry NO £ figures at all
// (statutory values arrive as tokens substituted from config).
for (const dir of ["content/guidance", "content/guides", "content/sectors"]) {
  for (const f of readdirSync(dir)) {
    const src = readFileSync(join(dir, f), "utf8");
    const m = src.match(/£\s?\d/);
    if (m) failures.push(`${join(dir, f)}: raw £ figure in content (use a config token)`);
  }
}

if (failures.length) {
  console.error("STATUTORY-LITERAL GATE FAILED:");
  for (const f of failures) console.error("  " + f);
  process.exit(1);
}
console.log("statutory-literals gate: CLEAN");
