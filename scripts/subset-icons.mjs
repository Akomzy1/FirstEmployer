// Regenerates public/fonts/MaterialSymbolsRounded.woff2 as a subset of ONLY the
// icon names used in the codebase (ligature-correct, all variable axes kept),
// via Google Fonts' server-side icon_names subsetting. The full font is 3MB and
// was the measured LCP killer on throttled mobile (17.1s → the font; DECISIONS
// 2026-07-12). Run this whenever a NEW icon name is introduced — an icon absent
// from the subset renders as its raw ligature text (e.g. "lock").
//
// Run: node scripts/subset-icons.mjs
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const names = new Set();
function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) {
      if (!/node_modules|\.next|design/.test(p)) walk(p);
    } else if (/\.(tsx?|css|js)$/.test(f)) {
      const src = readFileSync(p, "utf8");
      for (const m of src.matchAll(/name=["']([a-z][a-z0-9_]{2,30})["']/g)) names.add(m[1]);
      for (const m of src.matchAll(/fe-icon[^>]{0,80}>\s*([a-z][a-z0-9_]{2,30})\s*</g)) names.add(m[1]);
      for (const m of src.matchAll(/icon:\s*["']([a-z][a-z0-9_]{2,30})["']/g)) names.add(m[1]);
    }
  }
}
["components", "app", "lib", "public"].forEach(walk);

// Attribute/prop values the walkers match that are not icon names.
const NOT_ICONS = new Set(["name","type","email","main","www","http","https","svg","path","div","span","true","false","next","form","post","get","icon","text","label","value","none","auto","submit","button","password","tel","url","search","number","date","hidden","checkbox","radio","file","range","month","week","time","color","off","on"]);
const list = [...names].filter((n) => !NOT_ICONS.has(n)).sort();

const url =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=" +
  list.join(",") + "&display=block";
const css = await (await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36" } })).text();
const woff = css.match(/url\((https:[^)]+)\)/)?.[1];
if (!woff) {
  console.error("Google Fonts response had no font URL — icon name list may contain an invalid name.\n" + css.slice(0, 400));
  process.exit(1);
}
const buf = Buffer.from(await (await fetch(woff)).arrayBuffer());
writeFileSync("public/fonts/MaterialSymbolsRounded.woff2", buf);
writeFileSync("public/fonts/icon-names.json", JSON.stringify(list, null, 2) + "\n");
console.log(`${list.length} icons → ${Math.round(buf.length / 1024)}KB (manifest: public/fonts/icon-names.json)`);
