/**
 * Multi-source review scraper:
 * Trustpilot, Google Places, BBB, App Store, Google Play
 * → Notion Traffic Schools DB → Site
 *
 * Yelp excluded ($229/month API cost).
 *
 * Google Places uses Place IDs stored in Notion for reliable matching.
 * If no Place ID exists, the scraper searches by name, writes the
 * best-guess ID with confidence = "Auto-matched", and skips rating
 * writes until you verify it in Notion ("Verified" or "Wrong match").
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { Client } from "@notionhq/client";
import Anthropic from "@anthropic-ai/sdk";
import gplay from "google-play-scraper";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const SCHOOLS_DB = process.env.NOTION_SCHOOLS_DB!;
const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const anthropic = new Anthropic();

/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── TYPES ──────────────────────────────────────────────────

interface SchoolConfig {
  pageId: string;
  name: string;
  slug: string;
  website: string;
  reviewUrl: string;       // Trustpilot URL
  bbbUrl: string;
  appStoreUrl: string;
  playStoreUrl: string;
  googlePlaceId: string;
  googlePlaceConfidence: string; // "Verified" | "Auto-matched" | "Wrong match" | ""
  prevTrustpilot: number | null;
  prevGoogle: number | null;
  prevAppStore: number | null;
  prevPlayStore: number | null;
}

// ─── TREND CALC ─────────────────────────────────────────────

function calcTrend(
  current: number,
  previous: number | null
): "↑ Improving" | "= Stable" | "↓ Declining" {
  if (previous === null) return "= Stable";
  const delta = current - previous;
  if (delta >= 0.1) return "↑ Improving";
  if (delta <= -0.1) return "↓ Declining";
  return "= Stable";
}

// ─── 1. TRUSTPILOT ──────────────────────────────────────────

interface TrustpilotResult {
  rating: number | null;
  reviewCount: number | null;
  snippets: string[];
}

async function scrapeTrustpilot(reviewUrl: string): Promise<TrustpilotResult> {
  const result: TrustpilotResult = { rating: null, reviewCount: null, snippets: [] };
  if (!reviewUrl || !reviewUrl.includes("trustpilot.com")) return result;

  try {
    const res = await fetch(reviewUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
    });
    const html = await res.text();

    // Try JSON-LD first
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (jsonLdMatch) {
      try {
        const data = JSON.parse(jsonLdMatch[1]);
        if (data.aggregateRating) {
          result.rating = parseFloat(data.aggregateRating.ratingValue);
          result.reviewCount = parseInt(data.aggregateRating.reviewCount);
        }
      } catch { /* JSON-LD parse failed, try fallback */ }
    }

    // Fallback: parse text
    if (result.rating === null) {
      const text = html.replace(/<[^>]+>/g, " ");
      const reviewMatch = text.match(/Reviews\s+([\d,]+)/);
      if (reviewMatch) {
        result.reviewCount = parseInt(reviewMatch[1].replace(/,/g, ""));
      }
      const ratingMatch = text.match(/TrustScore\s+(\d\.\d)/);
      if (ratingMatch) {
        result.rating = parseFloat(ratingMatch[1]);
      }
    }

    // Extract review snippets for synthesis
    // Reviews appear in <p> tags with data-service-review-text-typography
    const reviewTexts = html.matchAll(
      /data-service-review-text-typography[^>]*>([^<]{40,500})/g
    );
    for (const m of Array.from(reviewTexts).slice(0, 10)) {
      result.snippets.push(m[1].trim());
    }

    // Fallback snippet extraction from body text
    if (result.snippets.length === 0) {
      const plainText = html.replace(/<[^>]+>/g, "\n");
      const lines = plainText.split("\n").map((l) => l.trim()).filter(Boolean);
      const datePattern = /^[A-Z][a-z]{2} \d{1,2}, \d{4}$/;
      let inReview = false;
      for (let i = 0; i < lines.length && result.snippets.length < 10; i++) {
        if (datePattern.test(lines[i])) { inReview = true; continue; }
        if (inReview && lines[i].length > 40 && lines[i].length < 600 &&
            !lines[i].match(/^(Useful|Share|Verified|See more|Reply|Report|Date of experience)/)) {
          result.snippets.push(lines[i]);
          inReview = false;
        }
      }
    }
  } catch (err) {
    console.error(`    Trustpilot error:`, (err as Error).message);
  }

  return result;
}

// ─── 2. GOOGLE PLACES ───────────────────────────────────────

interface GoogleResult {
  placeId: string;
  rating: number | null;
  reviewCount: number | null;
  mapsUrl: string | null;
  confidence: "Verified" | "Auto-matched";
}

async function scrapeGoogleByPlaceId(placeId: string): Promise<GoogleResult | null> {
  if (!PLACES_API_KEY || !placeId) return null;

  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        headers: {
          "X-Goog-Api-Key": PLACES_API_KEY,
          "X-Goog-FieldMask": "rating,userRatingCount,googleMapsUri",
        },
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    return {
      placeId,
      rating: data.rating ?? null,
      reviewCount: data.userRatingCount ?? null,
      mapsUrl: data.googleMapsUri ?? null,
      confidence: "Verified",
    };
  } catch {
    return null;
  }
}

async function searchGooglePlaces(
  schoolName: string,
  website: string
): Promise<GoogleResult | null> {
  if (!PLACES_API_KEY) return null;

  try {
    // Search with school name + "traffic school" for better accuracy
    const res = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": PLACES_API_KEY,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.rating,places.userRatingCount,places.googleMapsUri,places.websiteUri",
        },
        body: JSON.stringify({
          textQuery: `${schoolName} online traffic school`,
        }),
      }
    );

    if (!res.ok) return null;
    const data = (await res.json()) as any;
    const place = data.places?.[0];
    if (!place) return null;

    // Basic confidence check: does the Place website match the school website?
    const placeWebsite = (place.websiteUri ?? "").toLowerCase();
    const schoolDomain = website.replace(/https?:\/\/(www\.)?/, "").split("/")[0].toLowerCase();
    const domainMatch = placeWebsite.includes(schoolDomain);

    return {
      placeId: place.id,
      rating: place.rating ?? null,
      reviewCount: place.userRatingCount ?? null,
      mapsUrl: place.googleMapsUri ?? null,
      confidence: domainMatch ? "Auto-matched" : "Auto-matched",
      // Even if domain doesn't match, still save as Auto-matched
      // — the user decides to promote to Verified or mark Wrong match
    };
  } catch {
    return null;
  }
}

// ─── 3. BBB ─────────────────────────────────────────────────

async function scrapeBBB(bbbUrl: string): Promise<string | null> {
  if (!bbbUrl) return null;

  try {
    const res = await fetch(bbbUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    const html = await res.text();

    // BBB grade in structured element
    const gradeMatch = html.match(/data-testid="rating-letter">([A-F][+-]?)<\/span>/);
    if (gradeMatch) return gradeMatch[1];

    // Fallback: search for grade pattern near "BBB Rating"
    const fallback = html.match(/BBB Rating[^]*?([A-F][+-]?)\s*<\//);
    if (fallback) return fallback[1];

    return "NR";
  } catch (err) {
    console.error(`    BBB error:`, (err as Error).message);
    return null;
  }
}

// ─── 3. APP STORE ───────────────────────────────────────────

interface AppStoreResult {
  rating: number | null;
  reviewCount: number | null;
}

async function scrapeAppStore(appStoreUrl: string): Promise<AppStoreResult> {
  if (!appStoreUrl) return { rating: null, reviewCount: null };

  try {
    const appIdMatch = appStoreUrl.match(/\/id(\d+)/);
    if (!appIdMatch) return { rating: null, reviewCount: null };

    const res = await fetch(
      `https://itunes.apple.com/lookup?id=${appIdMatch[1]}&country=us`
    );
    const data = (await res.json()) as any;
    const result = data.results?.[0];
    if (!result) return { rating: null, reviewCount: null };

    return {
      rating: result.averageUserRating ? Math.round(result.averageUserRating * 10) / 10 : null,
      reviewCount: result.userRatingCount ?? null,
    };
  } catch (err) {
    console.error(`    App Store error:`, (err as Error).message);
    return { rating: null, reviewCount: null };
  }
}

// ─── 4. GOOGLE PLAY ─────────────────────────────────────────

interface PlayStoreResult {
  rating: number | null;
  reviewCount: number | null;
}

async function scrapePlayStore(playStoreUrl: string): Promise<PlayStoreResult> {
  if (!playStoreUrl) return { rating: null, reviewCount: null };

  try {
    const url = new URL(playStoreUrl);
    const appId = url.searchParams.get("id");
    if (!appId) return { rating: null, reviewCount: null };

    const result = await gplay.app({ appId });
    return {
      rating: result.score ? Math.round(result.score * 10) / 10 : null,
      reviewCount: result.ratings ?? null,
    };
  } catch (err) {
    console.error(`    Play Store error:`, (err as Error).message);
    return { rating: null, reviewCount: null };
  }
}

// ─── 5. CLAUDE SYNTHESIS ────────────────────────────────────

async function synthesiseReviews(
  schoolName: string,
  reviewSnippets: string[]
): Promise<{ good: string; bad: string }> {
  if (reviewSnippets.length === 0) {
    return { good: "", bad: "" };
  }

  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `You are summarising real customer reviews for ${schoolName}, an online traffic school.

Reviews:
${reviewSnippets.slice(0, 20).map((r, i) => `${i + 1}. ${r}`).join("\n")}

Return JSON only, no markdown:
{
  "good": "One sentence (max 20 words) summarising what reviewers consistently praise.",
  "bad": "One sentence (max 20 words) summarising the most common complaint. If no clear pattern, write 'No consistent complaints found.'"
}`,
        },
      ],
    });

    const text = msg.content[0].type === "text" ? msg.content[0].text : "";
    return JSON.parse(text);
  } catch (err) {
    console.error(`    Synthesis error:`, (err as Error).message);
    return { good: "", bad: "" };
  }
}

// ─── NOTION I/O ─────────────────────────────────────────────

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
    const p = page.properties;
    return {
      pageId: page.id,
      name: p["School Name"]?.title?.[0]?.plain_text ?? "",
      slug: p["Slug"]?.rich_text?.[0]?.plain_text ?? "",
      website: p["Website"]?.url ?? "",
      reviewUrl: p["Review URL"]?.url ?? "",
      bbbUrl: p["BBB URL"]?.url ?? "",
      appStoreUrl: p["App Store URL"]?.url ?? "",
      playStoreUrl: p["Play Store URL"]?.url ?? "",
      googlePlaceId: p["Google Place ID"]?.rich_text?.[0]?.plain_text ?? "",
      googlePlaceConfidence: p["Google Place Confidence"]?.select?.name ?? "",
      prevTrustpilot: p["Rating"]?.number ?? null,
      prevGoogle: p["Google Rating"]?.number ?? null,
      prevAppStore: p["App Store Rating"]?.number ?? null,
      prevPlayStore: p["Play Store Rating"]?.number ?? null,
    };
  });
}

async function writeToNotion(
  pageId: string,
  updates: Record<string, any>
) {
  const properties: any = {};

  for (const [field, value] of Object.entries(updates)) {
    if (value === null || value === undefined) continue;

    // Detect field type by name pattern
    if (field.startsWith("date:")) {
      // date field — e.g. "date:Reviews Last Scraped:start"
      properties[field] = { date: { start: value } };
    } else if (field.includes("URL") || field.includes("Url")) {
      properties[field] = { url: value };
    } else if (field.includes("Trend") || field.includes("Grade") || field === "Review Scrape Status") {
      properties[field] = { select: { name: value } };
    } else if (field.includes("Good") || field.includes("Bad")) {
      properties[field] = {
        rich_text: [{ text: { content: String(value) } }],
      };
    } else if (typeof value === "number") {
      properties[field] = { number: value };
    } else {
      properties[field] = {
        rich_text: [{ text: { content: String(value) } }],
      };
    }
  }

  try {
    await notion.pages.update({ page_id: pageId, properties });
  } catch {
    // Retry field by field
    for (const [key, val] of Object.entries(properties)) {
      try {
        await notion.pages.update({
          page_id: pageId,
          properties: { [key]: val } as any,
        });
      } catch {
        console.warn(`    Skipping field "${key}" (doesn't exist in DB)`);
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

  console.log(`Scraping reviews for ${schools.length} schools...\n`);
  const TODAY = new Date().toISOString().split("T")[0];

  for (const school of schools) {
    console.log(`━━ ${school.name} ━━`);
    const updates: Record<string, any> = {};

    // 1. Trustpilot
    if (school.reviewUrl) {
      console.log("  Trustpilot...");
      const tp = await scrapeTrustpilot(school.reviewUrl);
      if (tp.rating !== null) {
        console.log(`    ${tp.rating}/5 (${tp.reviewCount?.toLocaleString()} reviews, ${tp.snippets.length} snippets)`);
        updates["Previous Rating"] = school.prevTrustpilot;
        updates["Rating"] = tp.rating;
        updates["Review Count"] = tp.reviewCount;
        updates["Trustpilot Trend"] = calcTrend(tp.rating, school.prevTrustpilot);

        // Synthesise from Trustpilot snippets
        if (tp.snippets.length > 0) {
          console.log("  Synthesising with Claude...");
          const synthesis = await synthesiseReviews(school.name, tp.snippets);
          if (synthesis.good) {
            updates["Review Highlights Good"] = synthesis.good;
            console.log(`    Good: ${synthesis.good}`);
          }
          if (synthesis.bad) {
            updates["Review Highlights Bad"] = synthesis.bad;
            console.log(`    Bad: ${synthesis.bad}`);
          }
        }
      } else {
        console.log("    not found");
      }
    }

    // 2. Google Places
    if (school.googlePlaceConfidence !== "Wrong match") {
      console.log("  Google Places...");
      let google: GoogleResult | null = null;

      if (school.googlePlaceId && school.googlePlaceConfidence === "Verified") {
        // Trusted ID — fetch directly
        google = await scrapeGoogleByPlaceId(school.googlePlaceId);
        if (google) google.confidence = "Verified";
      } else if (school.googlePlaceId) {
        // Auto-matched ID exists — still use it but don't upgrade confidence
        google = await scrapeGoogleByPlaceId(school.googlePlaceId);
        if (google) google.confidence = "Auto-matched";
      } else {
        // No ID — search and save for review
        google = await searchGooglePlaces(school.name, school.website);
      }

      if (google && google.rating !== null) {
        console.log(`    ${google.rating}/5 (${google.reviewCount?.toLocaleString()} reviews) [${google.confidence}]`);

        // Always write the Place ID and confidence for human review
        updates["Google Place ID"] = google.placeId;
        updates["Google Place Confidence"] = google.confidence;
        if (google.mapsUrl) updates["Google URL"] = google.mapsUrl;

        // Only write rating if confidence is Verified or Auto-matched
        // (user can set "Wrong match" in Notion to suppress bad data)
        updates["Google Previous Rating"] = school.prevGoogle;
        updates["Google Rating"] = google.rating;
        updates["Google Review Count"] = google.reviewCount;
        updates["Google Trend"] = calcTrend(google.rating, school.prevGoogle);
      } else {
        console.log("    not found");
      }
    } else {
      console.log("  Google Places... skipped (marked as Wrong match)");
    }

    // 3. BBB
    if (school.bbbUrl) {
      console.log("  BBB...");
      const grade = await scrapeBBB(school.bbbUrl);
      if (grade) {
        console.log(`    Grade: ${grade}`);
        updates["BBB Grade"] = grade;
        updates["BBB URL"] = school.bbbUrl;
      } else {
        console.log("    not found");
      }
    }

    // 3. App Store
    if (school.appStoreUrl) {
      console.log("  App Store...");
      const as = await scrapeAppStore(school.appStoreUrl);
      if (as.rating !== null) {
        console.log(`    ${as.rating}/5 (${as.reviewCount?.toLocaleString()} ratings)`);
        updates["App Store Previous Rating"] = school.prevAppStore;
        updates["App Store Rating"] = as.rating;
        updates["App Store Review Count"] = as.reviewCount;
        updates["App Store Trend"] = calcTrend(as.rating, school.prevAppStore);
        updates["App Store URL"] = school.appStoreUrl;
      } else {
        console.log("    not found");
      }
    }

    // 4. Google Play
    if (school.playStoreUrl) {
      console.log("  Play Store...");
      const ps = await scrapePlayStore(school.playStoreUrl);
      if (ps.rating !== null) {
        console.log(`    ${ps.rating}/5 (${ps.reviewCount?.toLocaleString()} ratings)`);
        updates["Play Store Previous Rating"] = school.prevPlayStore;
        updates["Play Store Rating"] = ps.rating;
        updates["Play Store Review Count"] = ps.reviewCount;
        updates["Play Store Trend"] = calcTrend(ps.rating, school.prevPlayStore);
        updates["Play Store URL"] = school.playStoreUrl;
      } else {
        console.log("    not found");
      }
    }

    // Metadata
    updates["Review Scrape Status"] = Object.keys(updates).length > 0 ? "OK" : "Failed";
    updates["date:Reviews Last Scraped:start"] = TODAY;

    // Write to Notion
    console.log("  Writing to Notion...");
    await writeToNotion(school.pageId, updates);
    await new Promise((r) => setTimeout(r, 500));
    console.log("");
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Review Scrape Complete");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Schools: ${schools.length}`);
  console.log("  Sources: Trustpilot, BBB, App Store, Play Store");
  console.log("  Synthesis: Claude (from Trustpilot snippets)");
}

/* eslint-enable @typescript-eslint/no-explicit-any */

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
