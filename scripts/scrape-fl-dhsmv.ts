/**
 * DATA FLOW: FL DHSMV → Notion → Site
 *
 * Scrapes approved BDI (Basic Driver Improvement) course providers from
 * the FL DHSMV website. The provider list is a table on the page.
 */

import { rowIdentity, junkReason } from "../lib/directory-filter";
import { getExistingSchools } from "./lib/scraper-utils";
import { config } from "dotenv";
config({ path: ".env.local" });
import { scrapeFLProviders, onlineFromDelivery } from "./lib/fl-dhsmv";
import { makeNotionClient } from "./lib/notion-client";

const notion = makeNotionClient();
const DIRECTORY_DB = process.env.NOTION_DIRECTORY_DB!;

interface ScrapedSchool {
  name: string;
  deliveryMethod: string;
  phone: string;
  hasWebsite: boolean;
  notes: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/** The provider table, read from the DOM by the shared parser (scripts/lib/fl-dhsmv.ts, round 5). */
async function scrapeFLDHSMV(): Promise<ScrapedSchool[]> {
  console.log("Launching browser...");
  const providers = await scrapeFLProviders();
  console.log(`Scraped ${providers.length} FL BDI providers`);
  return providers.map((p) => ({ name: p.name, deliveryMethod: p.deliveryMethod, phone: p.phone, hasWebsite: !!p.website, notes: p.notes }));
}

async function syncToNotion(scraped: ScrapedSchool[]) {
  // Existing rows matched on real licence, then cleaned name (never the raw scraped name).
  const existing = await getExistingSchools("Florida");
  const TODAY = new Date().toISOString().split("T")[0];
  let created = 0, updated = 0;

  for (const school of scraped) {
    if (!school.name) continue;
    // Same validation the site renders through (lib/directory-filter, P0 follow-up): never write page furniture as a school.
    if (junkReason(school.name)) { console.log(`  skip (${junkReason(school.name)}): ${JSON.stringify(school.name)}`); continue; }

    const isOnline = onlineFromDelivery(school.deliveryMethod);

    const properties: any = {
      "School Name": { title: [{ text: { content: rowIdentity(school.name, "").name } }] },
      // The FLHSMV list publishes no licence number: leave the field empty, never a placeholder.
      "License Number": { rich_text: [] },
      Phone: { rich_text: [{ text: { content: school.phone || "" } }] },
      Address: {
        rich_text: [{ text: { content: school.deliveryMethod } }],
      },
      State: { select: { name: "Florida" } },
      "Online Available": { checkbox: isOnline },
      Source: { select: { name: "FL DHSMV" } },
      "Date Scraped": { date: { start: TODAY } },
      Notes: {
        rich_text: [
          {
            text: {
              content: school.notes
                ? `BDI Provider. ${school.notes}`
                : "BDI Provider",
            },
          },
        ],
      },
    };

    const match = existing.match(school.name, "");

    if (match) {
      await notion.pages.update({ page_id: match.id, properties });
      updated++;
    } else {
      const page = await notion.pages.create({
        parent: { database_id: DIRECTORY_DB },
        properties,
      });
      existing.add(page.id, school.name, "");
      created++;
    }

    await new Promise((r) => setTimeout(r, 350));
  }

  console.log(`
  ━━━━━━━━━━━━━━━━━━━━━━━━
  FL DHSMV Sync Complete
  ━━━━━━━━━━━━━━━━━━━━━━━━
  Scraped: ${scraped.length} BDI providers
  Created: ${created} new Notion records
  Updated: ${updated} existing records
  ━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}

/* eslint-enable @typescript-eslint/no-explicit-any */

async function triggerDeploy() {
  const hookUrl = process.env.VERCEL_DEPLOY_HOOK;
  if (!hookUrl) {
    console.log("No deploy hook configured — skipping redeploy");
    return;
  }
  await fetch(hookUrl, { method: "POST" });
  console.log("Vercel redeploy triggered");
}

async function main() {
  console.log("Starting FL DHSMV scrape...");
  const scraped = await scrapeFLDHSMV();
  await syncToNotion(scraped);

  if (process.argv.includes("--deploy")) {
    await triggerDeploy();
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
