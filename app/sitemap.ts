import type { MetadataRoute } from "next";
import { loadGuides, loadSectors } from "@/lib/marketing/content";
import { SITE_URL } from "@/lib/marketing/entity";

/** Segmented sitemap: core pages, guides, sectors, tools. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const core: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/features/contracts`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/features/status-advisor`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/trust`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/readiness`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/calculator`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/guides`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
  ];
  const guides: MetadataRoute.Sitemap = loadGuides().map((g) => ({
    url: `${SITE_URL}/guides/${g.slug}`,
    lastModified: g.lastReviewed ? new Date(g.lastReviewed) : now,
    changeFrequency: "monthly",
    priority: g.status === "live" ? 0.9 : 0.6,
  }));
  const sectors: MetadataRoute.Sitemap = loadSectors().map((s) => ({
    url: `${SITE_URL}/sectors/${s.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: s.status === "live" ? 0.8 : 0.6,
  }));
  return [...core, ...guides, ...sectors];
}
