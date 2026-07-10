/**
 * Marketing content collections (Build Prompt 13): guides and sectors as
 * committed .md files (front-matter + article HTML). Statutory figures in
 * content are TOKENS ({{NLW}}, {{RTW_PENALTY}}…) substituted from live config
 * at render (Rule 4) — the grep gate stays clean and rates can never go stale.
 */
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import type { ResolvedConfig } from "@/lib/config";

export interface GuideDoc {
  slug: string;
  title: string;
  category: string;
  description: string;
  answerBox: string;
  lastReviewed: string;
  reviewer: string;
  toc: { id: string; label: string }[];
  status: "live" | "stub";
  html: string;
}

export interface SectorDoc {
  slug: string;
  name: string;
  title: string;
  description: string;
  answerBox: string;
  status: "live" | "stub";
  html: string;
}

function parseFrontMatter(raw: string): { meta: Record<string, string>; body: string } | null {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return null;
  const meta: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].trim();
  }
  return { meta, body: m[2].trim() };
}

let guidesCache: GuideDoc[] | null = null;
let sectorsCache: SectorDoc[] | null = null;

export function loadGuides(): GuideDoc[] {
  if (guidesCache) return guidesCache;
  const dir = join(process.cwd(), "content", "guides");
  const docs: GuideDoc[] = [];
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".md")) continue;
    const parsed = parseFrontMatter(readFileSync(join(dir, f), "utf8"));
    if (!parsed) continue;
    const { meta, body } = parsed;
    docs.push({
      slug: meta.slug,
      title: meta.title,
      category: meta.category ?? "Guides",
      description: meta.description ?? "",
      answerBox: meta.answer_box ?? "",
      lastReviewed: meta.last_reviewed ?? "",
      reviewer: meta.reviewer ?? "",
      toc: (meta.toc ?? "").split(";").filter(Boolean).map((t) => {
        const [id, label] = t.split("|");
        return { id, label };
      }),
      status: (meta.status as "live" | "stub") ?? "stub",
      html: body,
    });
  }
  guidesCache = docs.sort((a, b) => (a.status === b.status ? a.title.localeCompare(b.title) : a.status === "live" ? -1 : 1));
  return guidesCache;
}

export function loadSectors(): SectorDoc[] {
  if (sectorsCache) return sectorsCache;
  const dir = join(process.cwd(), "content", "sectors");
  const docs: SectorDoc[] = [];
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".md")) continue;
    const parsed = parseFrontMatter(readFileSync(join(dir, f), "utf8"));
    if (!parsed) continue;
    const { meta, body } = parsed;
    docs.push({
      slug: meta.slug,
      name: meta.name,
      title: meta.title,
      description: meta.description ?? "",
      answerBox: meta.answer_box ?? "",
      status: (meta.status as "live" | "stub") ?? "stub",
      html: body,
    });
  }
  sectorsCache = docs.sort((a, b) => a.name.localeCompare(b.name));
  return sectorsCache;
}

const gbp = (n: number) => "£" + n.toLocaleString("en-GB");

/** Substitute statutory tokens from live config (dated rates, never stale). */
export function substituteTokens(text: string, config: ResolvedConfig): string {
  const v = config.values;
  return text
    .replaceAll("{{NLW}}", "£" + v.minimum_wage.nlw_21_plus.toFixed(2))
    .replaceAll("{{APPRENTICE_RATE}}", "£" + v.minimum_wage.apprentice.toFixed(2))
    .replaceAll("{{RTW_PENALTY}}", gbp(v.right_to_work.penalty_first_breach))
    .replaceAll("{{AE_TRIGGER}}", gbp(v.pension.ae_earnings_trigger))
    .replaceAll("{{EL_COVER}}", "£" + (v.insurance.el_min_cover / 1_000_000) + " million")
    .replaceAll("{{EL_PENALTY_DAY}}", gbp(v.insurance.el_penalty_per_day))
    .replaceAll("{{NI_THRESHOLD}}", gbp(v.ni.secondary_threshold_annual))
    .replaceAll("{{NI_ALLOWANCE}}", gbp(v.ni.employment_allowance))
    .replaceAll("{{NI_RATE}}", String(v.ni.employer_rate_pct))
    .replaceAll("{{CONFIG_LABEL}}", config.label);
}
