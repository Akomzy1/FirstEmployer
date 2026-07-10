import { getLiveConfig } from "@/lib/config";
import { loadGuides, loadSectors, substituteTokens } from "@/lib/marketing/content";
import { ENTITY_DESCRIPTOR, SITE_URL, SITE_NAME } from "@/lib/marketing/entity";

export const revalidate = 3600;

const strip = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

/** llms-full.txt (GEO): the full text of every guide and sector page, with
 *  statutory tokens substituted from live config so rates are never stale. */
export async function GET() {
  const config = await getLiveConfig();
  const guides = loadGuides();
  const sectors = loadSectors();
  const parts = [
    `# ${SITE_NAME} — full content for language models`,
    "",
    ENTITY_DESCRIPTOR,
    "",
    `Statutory rates in this file are current as of configuration ${config.label} (effective ${config.effectiveFrom}).`,
    "",
  ];
  for (const g of guides) {
    parts.push(`## ${g.title}`, `URL: ${SITE_URL}/guides/${g.slug}`, `Last reviewed: ${g.lastReviewed}`, "", `Short answer: ${substituteTokens(g.answerBox, config)}`, "", strip(substituteTokens(g.html, config)), "");
  }
  for (const s of sectors) {
    parts.push(`## ${s.title}`, `URL: ${SITE_URL}/sectors/${s.slug}`, "", `Short answer: ${substituteTokens(s.answerBox, config)}`, "", strip(substituteTokens(s.html, config)), "");
  }
  return new Response(parts.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
