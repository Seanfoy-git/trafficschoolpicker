/**
 * DATA FLOW: Google Places API → Notion → Site
 *
 * JOB 4: Enriches directory schools with website URLs and Google
 * ratings via the Places Text Search API. Only processes schools where
 * the Website field is empty (not yet enriched).
 *
 * Cost: ~$0.002 per lookup. 204 CA schools = ~$0.41.
 * Requires GOOGLE_PLACES_API_KEY from console.cloud.google.com
 * (enable "Places API (New)").
 *
 * Rate limits:
 * - Notion API: 3 requests/second → 350ms delay between writes
 * - Google Places: 10 QPS for Text Search → 150ms delay
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DIRECTORY_DB = process.env.NOTION_DIRECTORY_DB!;
const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY!;

/* eslint-disable @typescript-eslint/no-explicit-any */

interface PlacesResult {
  placeId: string;
  website: string | null;
  rating: number | null;
  userRatingCount: number | null;
  name: string;
}

async function queryGooglePlaces(
  schoolName: string,
  stateCode: string
): Promise<PlacesResult | null> {
  const query = `${schoolName} traffic school ${stateCode}`;
  const url = "https://places.googleapis.com/v1/places:searchText";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": PLACES_API_KEY,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.websiteUri,places.rating,places.userRatingCount",
    },
    body: JSON.stringify({ textQuery: query }),
  });

  if (!response.ok) {
    console.error(`  Places API error: ${response.status}`);
    return null;
  }

  const data = (await response.json()) as any;

  if (!data.places || data.places.length === 0) {
    return null;
  }

  const place = data.places[0];
  return {
    placeId: place.id,
    website: place.websiteUri ?? null,
    rating: place.rating ?? null,
    userRatingCount: place.userRatingCount ?? null,
    name: place.displayName?.text ?? "",
  };
}

// State name → 2-letter code for better Places query accuracy
const STATE_CODES: Record<string, string> = {
  California: "CA", Texas: "TX", Florida: "FL", "New York": "NY",
  Arizona: "AZ", Georgia: "GA", Ohio: "OH", Illinois: "IL",
  Pennsylvania: "PA", "North Carolina": "NC", Michigan: "MI",
  "New Jersey": "NJ", Virginia: "VA", Washington: "WA",
  Colorado: "CO", Nevada: "NV", Oregon: "OR", Tennessee: "TN",
};

async function getPendingSchools(): Promise<any[]> {
  const results: any[] = [];
  let cursor: string | undefined;

  do {
    const response: any = await notion.databases.query({
      database_id: DIRECTORY_DB,
      filter: {
        and: [
          { property: "Online Available", checkbox: { equals: true } },
          // Only schools without a website yet
          {
            or: [
              { property: "Website", url: { is_empty: true } },
            ],
          },
        ],
      },
      page_size: 100,
      start_cursor: cursor,
    });

    results.push(...response.results);
    cursor = response.has_more
      ? response.next_cursor ?? undefined
      : undefined;
  } while (cursor);

  return results;
}

async function main() {
  if (!PLACES_API_KEY) {
    console.error("GOOGLE_PLACES_API_KEY not set in environment");
    process.exit(1);
  }

  if (!DIRECTORY_DB) {
    console.error("NOTION_DIRECTORY_DB not set in environment");
    process.exit(1);
  }

  const schools = await getPendingSchools();
  console.log(
    `Enriching ${schools.length} directory schools via Google Places...\n`
  );

  if (schools.length === 0) {
    console.log("No schools need enrichment. Done.");
    return;
  }

  const estimatedCost = (schools.length * 0.002).toFixed(2);
  console.log(`  Estimated cost: ~$${estimatedCost}`);
  console.log("  Starting in 3 seconds... (Ctrl+C to cancel)\n");
  await new Promise((r) => setTimeout(r, 3000));

  const TODAY = new Date().toISOString().split("T")[0];
  let enriched = 0;
  let notFound = 0;
  let failed = 0;

  for (const page of schools) {
    const props = page.properties;
    const name = props["School Name"]?.title?.[0]?.plain_text ?? "";
    const state = props["State"]?.select?.name ?? "";
    const stateCode = STATE_CODES[state] ?? state.substring(0, 2).toUpperCase();

    if (!name) continue;

    try {
      const result = await queryGooglePlaces(name, stateCode);

      if (!result) {
        notFound++;
        console.log(`  -- ${name} → not found`);
      } else {
        const updateProps: any = {
          Notes: {
            rich_text: [
              {
                text: {
                  content: `Google Place ID: ${result.placeId}. Enriched ${TODAY}.`,
                },
              },
            ],
          },
        };

        if (result.website) {
          updateProps["Website"] = { url: result.website };
        }

        await notion.pages.update({
          page_id: page.id,
          properties: updateProps,
        });
        enriched++;

        if (result.website) {
          console.log(`  OK ${name} → ${result.website}`);
        } else {
          console.log(`  OK ${name} → place found, no website`);
        }
      }
    } catch (err) {
      console.error(`  ERR ${name}: ${(err as Error).message}`);
      failed++;
    }

    // Respect Places API rate limits
    await new Promise((r) => setTimeout(r, 150));
    // Notion rate limit
    await new Promise((r) => setTimeout(r, 350));
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Enrichment Complete");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Enriched:   ${enriched}`);
  console.log(`  Not Found:  ${notFound}`);
  console.log(`  Failed:     ${failed}`);
  console.log(`  Est. cost:  ~$${(schools.length * 0.002).toFixed(2)}`);
}

/* eslint-enable @typescript-eslint/no-explicit-any */

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
