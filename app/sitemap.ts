import { MetadataRoute } from "next";
import { STATE_SEO, BLOG_SEO } from "@/lib/seo-config";
import { getAllStateSlugs } from "@/lib/state-utils";

const BASE_URL = "https://www.trafficschoolpicker.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/schools`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
  ];

  // State pages — include all 50 states from routing, use SEO config for those that have it
  const statePages: MetadataRoute.Sitemap = getAllStateSlugs().map((slug) => {
    const seo = STATE_SEO[slug];
    return {
      url: `${BASE_URL}${seo?.canonicalPath ?? `/${slug}`}`,
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
