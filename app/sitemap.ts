import { MetadataRoute } from "next";
import { STATE_SEO, BLOG_SEO } from "@/lib/seo-config";
import { STATE_LIST } from "@/lib/state-utils";
import { getCompletedStateCodes } from "@/lib/notion";

const BASE_URL = "https://www.trafficschoolpicker.com";

// Re-fetch the completed-states set on the same cadence as the state pages
// (24h) so newly-flipped Content Status rows appear in the sitemap on the
// next ISR refresh, not the next deploy.
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/schools`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
  ];

  // State pages — only include states whose Content Status = Complete in the
  // States DB. Submitting templated/thin pages was the cause of the GSC
  // "Discovered – currently not indexed" backlog; pulling them from the
  // sitemap is the strongest positive signal we can send while content fills in.
  // States still resolve at /<slug> for direct navigation and internal links.
  const completed = await getCompletedStateCodes();
  const statePages: MetadataRoute.Sitemap = STATE_LIST
    .filter((s) => completed.has(s.code.toUpperCase()))
    .map((s) => {
      const seo = STATE_SEO[s.slug];
      return {
        url: `${BASE_URL}${seo?.canonicalPath ?? `/${s.slug}`}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.9,
      };
    });

  // Blog posts
  const blogPages: MetadataRoute.Sitemap = Object.values(BLOG_SEO).map((seo) => ({
    url: `${BASE_URL}${seo.canonicalPath}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...statePages, ...blogPages];
}
