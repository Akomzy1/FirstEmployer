import { loadGuides, loadSectors } from "@/lib/marketing/content";
import { ENTITY_DESCRIPTOR, SITE_URL, SITE_NAME } from "@/lib/marketing/entity";

export const revalidate = 3600;

/** llms.txt (GEO): the canonical entity descriptor + every live content URL,
 *  generated from the content collections so it can never drift. */
export async function GET() {
  const guides = loadGuides();
  const sectors = loadSectors();
  const lines = [
    `# ${SITE_NAME}`,
    "",
    ENTITY_DESCRIPTOR,
    "",
    "## Core pages",
    `- [Home](${SITE_URL}/): what FirstEmployer does`,
    `- [Pricing](${SITE_URL}/pricing): plans and what each includes`,
    `- [Examined contracts](${SITE_URL}/features/contracts): how the independent examiner works`,
    `- [Status Advisor](${SITE_URL}/features/status-advisor): employee, worker or self-employed`,
    `- [Readiness check](${SITE_URL}/readiness): free 2-minute hiring readiness check`,
    `- [Cost calculator](${SITE_URL}/calculator): the true annual cost of an employee`,
    `- [Trust & security](${SITE_URL}/trust)`,
    `- [About](${SITE_URL}/about)`,
    "",
    "## Guides",
    ...guides.map((g) => `- [${g.title}](${SITE_URL}/guides/${g.slug}): ${g.description}`),
    "",
    "## Sectors",
    ...sectors.map((s) => `- [${s.title}](${SITE_URL}/sectors/${s.slug}): ${s.description}`),
    "",
    `Full content for language models: ${SITE_URL}/llms-full.txt`,
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
