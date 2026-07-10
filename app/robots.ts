import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/marketing/entity";

/** robots.txt — AI crawlers explicitly welcomed on marketing content (GEO);
 *  the app and admin are never crawlable. */
export default function robots(): MetadataRoute.Robots {
  const disallow = ["/app", "/admin", "/onboarding", "/auth", "/api"];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      { userAgent: "GPTBot", allow: "/", disallow },
      { userAgent: "ClaudeBot", allow: "/", disallow },
      { userAgent: "Claude-Web", allow: "/", disallow },
      { userAgent: "PerplexityBot", allow: "/", disallow },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
