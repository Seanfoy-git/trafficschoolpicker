/**
 * DATA FLOW: Trustpilot + Google + Yelp → Notion → Site
 *
 * Scrapes ratings and review snippets from all three platforms for each
 * Tier 1/2 school. Writes per-platform ratings to Notion and synthesizes
 * common pros/cons from review text.
 *
 * Rate limits:
 * - Notion API: 3 req/sec → 350ms delay
 * - Trustpilot/Yelp: Playwright with 2s delay between pages
 * - Google Places: API with key, 150ms delay
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { chromium } from "playwright";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const SCHOOLS_DB = process.env.NOTION_SCHOOLS_DB!;
const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── TYPES ──────────────────────────────────────────────────

interface PlatformResult {
  platform: "Trustpilot" | "Google" | "Yelp";
  rating: number | null;
  reviewCount: number | null;
  url: string;
  snippets: string[]; // Recent review excerpts for synthesis
}

interface NotionSchool {
  pageId: string;
  name: string;
  slug: string;
  website: string;
  trustpilotUrl: string;
  googleUrl: string;
  yelpUrl: string;
  prevTrustpilot: number | null;
  prevGoogle: number | null;
  prevYelp: number | null;
}

// ─── TRUSTPILOT SCRAPER ─────────────────────────────────────

async function scrapeTrustpilot(
  domain: string,
  page: import("playwright").Page
): Promise<PlatformResult> {
  const url = `https://www.trustpilot.com/review/${domain}`;
  const result: PlatformResult = {
    platform: "Trustpilot",
    rating: null,
    reviewCount: null,
    url,
    snippets: [],
  };

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(2000);

    const text = await page.evaluate(() => document.body.innerText);
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    // Find rating and count
    // Pattern: "Reviews 26,951" on one line, then "•" or blank, then "4.8"
    for (let i = 0; i < lines.length; i++) {
      const reviewMatch = lines[i].match(/Reviews\s+([\d,]+)/);
      if (reviewMatch) {
        result.reviewCount = parseInt(reviewMatch[1].replace(/,/g, ""));
        // Rating might be on same line, next line, or line after "•"
        const ratingMatch =
          lines[i].match(/(\d\.\d)/) ||
          lines[i + 1]?.match(/^(\d\.\d)$/) ||
          lines[i + 2]?.match(/^(\d\.\d)$/);
        if (ratingMatch) result.rating = parseFloat(ratingMatch[1]);
        break;
      }
    }

    // Extract review snippets — look for actual review text
    // Reviews on Trustpilot appear after date lines like "Mar 27, 2026"
    const datePattern = /^[A-Z][a-z]{2} \d{1,2}, \d{4}$/;
    let inReviewZone = false;
    for (let i = 0; i < lines.length && result.snippets.length < 10; i++) {
      if (datePattern.test(lines[i])) {
        inReviewZone = true;
        continue;
      }
      if (inReviewZone && lines[i].length > 40 && lines[i].length < 600) {
        // Skip UI elements
        if (
          !lines[i].match(/^(Useful|Share|Verified|See more|Reply|Report|Was this|Date of experience)/) &&
          !lines[i].match(/^\d+ review/) &&
          !lines[i].includes("Trustpilot") &&
          !lines[i].includes("Cookie")
        ) {
          result.snippets.push(lines[i]);
          inReviewZone = false; // One snippet per review
        }
      }
    }
  } catch (err) {
    console.error(`  Trustpilot error for ${domain}:`, (err as Error).message);
  }

  return result;
}

// ─── GOOGLE PLACES SCRAPER ──────────────────────────────────

async function scrapeGoogle(
  schoolName: string
): Promise<PlatformResult> {
  const result: PlatformResult = {
    platform: "Google",
    rating: null,
    reviewCount: null,
    url: `https://www.google.com/search?q=${encodeURIComponent(schoolName + " reviews")}`,
    snippets: [],
  };

  if (!PLACES_API_KEY) return result;

  try {
    // Use legacy Places API (Text Search) — works with standard API keys
    const query = encodeURIComponent(schoolName);
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${PLACES_API_KEY}`;
    const response = await fetch(url);

    if (response.ok) {
      const data = (await response.json()) as any;
      const place = data.results?.[0];
      if (place) {
        result.rating = place.rating ?? null;
        result.reviewCount = place.user_ratings_total ?? null;
        const placeId = place.place_id;
        if (placeId) {
          result.url = `https://www.google.com/maps/place/?q=place_id:${placeId}`;
        }
      }
    }
  } catch (err) {
    console.error(`  Google error for ${schoolName}:`, (err as Error).message);
  }

  return result;
}

// ─── YELP SCRAPER ───────────────────────────────────────────

async function scrapeYelp(
  schoolName: string,
  page: import("playwright").Page
): Promise<PlatformResult> {
  const searchUrl = `https://www.yelp.com/search?find_desc=${encodeURIComponent(schoolName + " traffic school")}`;
  const result: PlatformResult = {
    platform: "Yelp",
    rating: null,
    reviewCount: null,
    url: searchUrl,
    snippets: [],
  };

  try {
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(3000);

    const text = await page.evaluate(() => document.body.innerText);

    // Yelp shows rating as "X.0 star rating" and review count as "X reviews"
    const ratingMatch = text.match(/(\d\.\d)\s*star rating/i);
    if (ratingMatch) result.rating = parseFloat(ratingMatch[1]);

    const countMatch = text.match(/(\d+)\s*reviews?/i);
    if (countMatch) result.reviewCount = parseInt(countMatch[1]);

    // Try to get the actual business page URL
    const bizLink = await page.$('a[href*="/biz/"]');
    if (bizLink) {
      const href = await bizLink.getAttribute("href");
      if (href) {
        result.url = href.startsWith("http") ? href : `https://www.yelp.com${href}`;
      }
    }

    // Extract review snippets
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (
        line.length > 50 &&
        line.length < 500 &&
        !line.includes("Yelp") &&
        !line.includes("Filter") &&
        !line.includes("Sort") &&
        !line.includes("Sign Up") &&
        result.snippets.length < 5
      ) {
        result.snippets.push(line);
      }
    }
  } catch (err) {
    console.error(`  Yelp error for ${schoolName}:`, (err as Error).message);
  }

  return result;
}

// ─── REVIEW SYNTHESIS ───────────────────────────────────────

function synthesizeReviews(allSnippets: string[]): {
  pros: string[];
  cons: string[];
} {
  if (allSnippets.length === 0) return { pros: [], cons: [] };

  // Keyword-based categorization of review themes
  const proKeywords = [
    "easy", "fast", "quick", "simple", "affordable", "cheap", "great",
    "excellent", "helpful", "convenient", "recommend", "love", "best",
    "smooth", "straightforward", "professional", "friendly", "worth",
    "mobile", "app", "certificate", "dismissed", "passed",
  ];
  const conKeywords = [
    "slow", "confusing", "expensive", "boring", "frustrating", "difficult",
    "poor", "terrible", "worst", "scam", "misleading", "hidden fees",
    "customer service", "support", "glitch", "crash", "error", "bug",
    "outdated", "repetitive", "long", "tedious",
  ];

  const proThemes = new Map<string, number>();
  const conThemes = new Map<string, number>();

  for (const snippet of allSnippets) {
    const lower = snippet.toLowerCase();

    for (const keyword of proKeywords) {
      if (lower.includes(keyword)) {
        // Group similar keywords
        const theme = getTheme(keyword, "pro");
        proThemes.set(theme, (proThemes.get(theme) ?? 0) + 1);
      }
    }

    for (const keyword of conKeywords) {
      if (lower.includes(keyword)) {
        const theme = getTheme(keyword, "con");
        conThemes.set(theme, (conThemes.get(theme) ?? 0) + 1);
      }
    }
  }

  // Sort by frequency and take top 5
  const pros = Array.from(proThemes.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme]) => theme);

  const cons = Array.from(conThemes.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme]) => theme);

  return { pros, cons };
}

function getTheme(keyword: string, type: "pro" | "con"): string {
  const proThemeMap: Record<string, string> = {
    easy: "Easy to complete",
    fast: "Fast completion time",
    quick: "Fast completion time",
    simple: "Simple and straightforward",
    straightforward: "Simple and straightforward",
    affordable: "Affordable pricing",
    cheap: "Affordable pricing",
    great: "Highly rated by students",
    excellent: "Highly rated by students",
    best: "Highly rated by students",
    helpful: "Helpful customer support",
    convenient: "Convenient online format",
    recommend: "Widely recommended",
    love: "Widely recommended",
    smooth: "Smooth user experience",
    professional: "Professional service",
    friendly: "Friendly customer support",
    worth: "Good value for money",
    mobile: "Works well on mobile",
    app: "Good mobile app",
    certificate: "Fast certificate delivery",
    dismissed: "Successfully dismisses tickets",
    passed: "High pass rate",
  };

  const conThemeMap: Record<string, string> = {
    slow: "Slow loading or processing",
    confusing: "Confusing navigation or content",
    expensive: "Higher than expected cost",
    boring: "Boring course content",
    frustrating: "Frustrating user experience",
    difficult: "Difficult to navigate",
    poor: "Poor quality content",
    terrible: "Very negative experiences reported",
    worst: "Very negative experiences reported",
    scam: "Trust concerns raised",
    misleading: "Misleading pricing or claims",
    "hidden fees": "Hidden fees or charges",
    "customer service": "Customer service issues",
    support: "Customer service issues",
    glitch: "Technical issues reported",
    crash: "Technical issues reported",
    error: "Technical issues reported",
    bug: "Technical issues reported",
    outdated: "Outdated course material",
    repetitive: "Repetitive content",
    long: "Course feels too long",
    tedious: "Tedious to complete",
  };

  if (type === "pro") return proThemeMap[keyword] ?? keyword;
  return conThemeMap[keyword] ?? keyword;
}

// ─── NOTION I/O ─────────────────────────────────────────────

interface SchoolConfig {
  pageId: string;
  name: string;
  slug: string;
  website: string;
  trustpilotUrl: string;
  yelpUrl: string;
  prevTrustpilot: number | null;
  prevGoogle: number | null;
  prevYelp: number | null;
}

async function getSchoolsFromNotion(): Promise<SchoolConfig[]> {
  if (!SCHOOLS_DB) return [];

  const response = await notion.databases.query({
    database_id: SCHOOLS_DB,
    filter: {
      and: [
        { property: "Status", select: { equals: "Active" } },
        { property: "Show On Site", checkbox: { equals: true } },
      ],
    },
  });

  return (response.results as any[]).map((page) => {
    const props = page.properties;
    return {
      pageId: page.id,
      name: props["School Name"]?.title?.[0]?.plain_text ?? "",
      slug:
        props["Slug"]?.rich_text?.[0]?.plain_text ??
        (props["School Name"]?.title?.[0]?.plain_text ?? "")
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, ""),
      website: props["Website"]?.url ?? "",
      trustpilotUrl: props["Review URL"]?.url ?? "",
      yelpUrl: props["Yelp URL"]?.url ?? "",
      prevTrustpilot: props["Rating"]?.number ?? null,
      prevGoogle: props["Google Rating"]?.number ?? null,
      prevYelp: props["Yelp Rating"]?.number ?? null,
    };
  });
}

function extractDomain(url: string): string | null {
  // From Trustpilot URL or website
  const tpMatch = url.match(/trustpilot\.com\/review\/(.+)/);
  if (tpMatch) return tpMatch[1].replace(/\/$/, "");

  // From website URL
  try {
    const u = new URL(url);
    return u.hostname;
  } catch {
    return null;
  }
}

async function updateNotionSchool(
  pageId: string,
  results: PlatformResult[],
  synthesized: { pros: string[]; cons: string[] }
) {
  const TODAY = new Date().toISOString().split("T")[0];
  const properties: any = {};

  const tp = results.find((r) => r.platform === "Trustpilot");
  const gg = results.find((r) => r.platform === "Google");
  const yp = results.find((r) => r.platform === "Yelp");

  // Trustpilot → existing Rating/Review Count/Review URL fields
  if (tp && tp.rating !== null) {
    properties["Rating"] = { number: tp.rating };
    properties["Review Count"] = { number: tp.reviewCount };
    if (tp.url) properties["Review URL"] = { url: tp.url };
  }

  // Google → Google Rating/Google Review Count/Google URL
  if (gg && gg.rating !== null) {
    properties["Google Rating"] = { number: gg.rating };
    properties["Google Review Count"] = { number: gg.reviewCount };
    if (gg.url) properties["Google URL"] = { url: gg.url };
  }

  // Yelp → Yelp Rating/Yelp Review Count/Yelp URL
  if (yp && yp.rating !== null) {
    properties["Yelp Rating"] = { number: yp.rating };
    properties["Yelp Review Count"] = { number: yp.reviewCount };
    if (yp.url) properties["Yelp URL"] = { url: yp.url };
  }

  // Synthesized highlights
  if (synthesized.pros.length > 0) {
    properties["Review Highlights Good"] = {
      rich_text: [{ text: { content: synthesized.pros.join("\n") } }],
    };
  }
  if (synthesized.cons.length > 0) {
    properties["Review Highlights Bad"] = {
      rich_text: [{ text: { content: synthesized.cons.join("\n") } }],
    };
  }

  try {
    await notion.pages.update({ page_id: pageId, properties });
  } catch {
    // Some fields may not exist yet — retry one at a time
    for (const [key, val] of Object.entries(properties)) {
      try {
        const singleProp: any = { [key]: val };
        await notion.pages.update({
          page_id: pageId,
          properties: singleProp,
        });
      } catch {
        console.warn(`    Skipping field "${key}" (doesn't exist in DB yet)`);
      }
      await new Promise((r) => setTimeout(r, 350));
    }
  }
}

// ─── MAIN ───────────────────────────────────────────────────

async function main() {
  const schools = await getSchoolsFromNotion();
  if (schools.length === 0) {
    console.log("No schools found. Check NOTION_SCHOOLS_DB.");
    return;
  }

  console.log(`Scraping reviews for ${schools.length} schools across 3 platforms...\n`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  for (const school of schools) {
    console.log(`${school.name}`);

    const allResults: PlatformResult[] = [];
    const allSnippets: string[] = [];

    // 1. Trustpilot
    const tpDomain = school.trustpilotUrl.includes("trustpilot.com")
      ? extractDomain(school.trustpilotUrl)
      : extractDomain(school.website);
    if (tpDomain) {
      console.log(`  Trustpilot (${tpDomain})...`);
      const tp = await scrapeTrustpilot(tpDomain, page);
      allResults.push(tp);
      allSnippets.push(...tp.snippets);
      if (tp.rating) console.log(`    ${tp.rating}/5 (${tp.reviewCount} reviews)`);
      else console.log("    not found");
      await new Promise((r) => setTimeout(r, 2000));
    }

    // 2. Google Places
    console.log("  Google Places...");
    const google = await scrapeGoogle(school.name);
    allResults.push(google);
    allSnippets.push(...google.snippets);
    if (google.rating) console.log(`    ${google.rating}/5 (${google.reviewCount} reviews)`);
    else console.log("    not found");
    await new Promise((r) => setTimeout(r, 500));

    // 3. Yelp
    console.log("  Yelp...");
    const yelp = await scrapeYelp(school.name, page);
    allResults.push(yelp);
    allSnippets.push(...yelp.snippets);
    if (yelp.rating) console.log(`    ${yelp.rating}/5 (${yelp.reviewCount} reviews)`);
    else console.log("    not found");
    await new Promise((r) => setTimeout(r, 2000));

    // 4. Synthesize pros/cons from all snippets
    const synthesized = synthesizeReviews(allSnippets);
    if (synthesized.pros.length > 0)
      console.log(`  Synthesized: ${synthesized.pros.length} pros, ${synthesized.cons.length} cons`);

    // 5. Write to Notion
    console.log("  Writing to Notion...");
    await updateNotionSchool(school.pageId, allResults, synthesized);
    await new Promise((r) => setTimeout(r, 350));

    console.log("");
  }

  await browser.close();

  // Summary
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Multi-Platform Review Scrape Complete");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Schools processed: ${schools.length}`);
  console.log("  Platforms: Trustpilot, Google, Yelp");
  console.log("  Check Notion for updated ratings and synthesized pros/cons");
}

/* eslint-enable @typescript-eslint/no-explicit-any */

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
