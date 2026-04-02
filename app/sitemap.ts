import { MetadataRoute } from "next";
import { getAllStateSlugs } from "@/lib/state-utils";
import { getAllSchools } from "@/lib/notion";
import { blogPosts } from "@/lib/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://trafficschoolpicker.com";

  let schools: { slug: string }[] = [];
  try {
    schools = await getAllSchools();
  } catch {
    // Notion may not be configured yet
  }

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${baseUrl}/admin`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
  ];

  const statePages = getAllStateSlugs().map((slug) => ({
    url: `${baseUrl}/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const reviewPages = schools.map((school) => ({
    url: `${baseUrl}/reviews/${school.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const blogPages = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...statePages, ...reviewPages, ...blogPages];
}
