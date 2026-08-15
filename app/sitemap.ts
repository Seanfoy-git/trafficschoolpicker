import { MetadataRoute } from "next";
import { STATE_SEO, BLOG_SEO } from "@/lib/seo-config";
import { STATE_LIST } from "@/lib/state-utils";
import {
  getLinkableStateCodes,
  getStateVerificationMap,
  getLatestStateVerification,
  getAllSchools,
} from "@/lib/notion";
import { getAllPosts } from "@/lib/blog";

const BASE_URL = "https://www.trafficschoolpicker.com";

// Fixed lastmod for pages that change only on deliberate edits (about + legal).
// Bump this by hand when you revise those pages. Do NOT wire it to build time or
// new Date(): if every crawl sees a fresh lastmod, Google learns the signal is
// meaningless and ignores it — which is exactly the state we're fixing.
const STATIC_LASTMOD = "2026-08-01";

// Re-fetch the completed-states set on the same cadence as the state pages
// (24h) so newly-flipped Content Status rows appear in the sitemap on the
// next ISR refresh, not the next deploy.
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [linkable, stateVerified, latestVerified, schools] = await Promise.all([
    getLinkableStateCodes(),
    getStateVerificationMap(),
    getLatestStateVerification(),
    getAllSchools(),
  ]);
  const posts = getAllPosts();

  // Index-style pages (home, /schools) reflect the underlying state data, so
  // their freshness is the most recent state "Last Verified" — a real content
  // date, never the current timestamp.
  const dataLastmod = latestVerified ?? STATIC_LASTMOD;

  // /blog index freshness = newest post update.
  const blogIndexLastmod =
    posts.reduce<string | null>((max, p) => {
      const d = p.updatedAt || p.publishedAt || null;
      return d && (!max || d > max) ? d : max;
    }, null) ?? STATIC_LASTMOD;

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: dataLastmod, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/schools`, lastModified: dataLastmod, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/reviews`, lastModified: dataLastmod, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/about`, lastModified: STATIC_LASTMOD, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/blog`, lastModified: blogIndexLastmod, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/disclaimer`, lastModified: STATIC_LASTMOD, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: STATIC_LASTMOD, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/privacy`, lastModified: STATIC_LASTMOD, changeFrequency: "yearly", priority: 0.3 },
  ];

  // State pages — driven by the same getLinkableStateCodes() gate as every
  // internal-link surface (Content Status = Complete), so the sitemap and the
  // link graph never diverge: a page is sitemapped iff it's linked. Submitting
  // templated/thin pages was the cause of the GSC "Discovered – currently not
  // indexed" backlog; gating on Complete is the strongest positive signal we can
  // send while content fills in. States still resolve at /<slug> for direct
  // navigation. lastmod is each state's real "Last Verified" date.
  const statePages: MetadataRoute.Sitemap = STATE_LIST
    .filter((s) => linkable.has(s.code.toUpperCase()))
    .map((s) => {
      const seo = STATE_SEO[s.slug];
      return {
        url: `${BASE_URL}${seo?.canonicalPath ?? `/${s.slug}`}`,
        lastModified: stateVerified.get(s.code.toUpperCase()) ?? dataLastmod,
        changeFrequency: "weekly" as const,
        priority: 0.9,
      };
    });

  // Blog posts — lastmod keyed by slug from MDX frontmatter (updatedAt, then
  // publishedAt). URL set stays driven by BLOG_SEO so nothing changes there.
  const postDates = new Map(
    posts.map((p) => [p.slug, p.updatedAt || p.publishedAt || null] as const)
  );
  const blogPages: MetadataRoute.Sitemap = Object.entries(BLOG_SEO).map(
    ([slug, seo]) => ({
      url: `${BASE_URL}${seo.canonicalPath}`,
      lastModified: postDates.get(slug) ?? blogIndexLastmod,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })
  );

  // Review pages — one per school. getAllSchools is already filtered to
  // Show On Site = true + eligible, so the sitemap set matches the pages that
  // actually render at /reviews/<slug>. lastmod is each school's real
  // "Last Verified" date, never build time (same discipline as state/blog).
  const reviewPages: MetadataRoute.Sitemap = schools.map((s) => ({
    url: `${BASE_URL}/reviews/${s.slug}`,
    lastModified: s.lastVerified ?? STATIC_LASTMOD,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...statePages, ...blogPages, ...reviewPages];
}
