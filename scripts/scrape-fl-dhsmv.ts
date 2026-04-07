/**
 * DATA FLOW: FL DHSMV → Notion → Site
 *
 * Scrapes approved BDI (Basic Driver Improvement) course providers from
 * the FL DHSMV website. The provider list is a table on the page.
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { chromium } from "playwright";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DIRECTORY_DB = process.env.NOTION_DIRECTORY_DB!;

const BDI_URL =
  "https://www.flhsmv.gov/driver-licenses-id-cards/education-courses/driver-improvement-schools/basic-driver-improvement-bdi-find-approved-listing-bdi-course-providers/";

interface ScrapedSchool {
  name: string;
  deliveryMethod: string;
  phone: string;
  hasWebsite: boolean;
  notes: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

async function scrapeFLDHSMV(): Promise<ScrapedSchool[]> {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(BDI_URL, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(2000);

  // The BDI providers are in a table with columns: NAME, DELIVERY METHOD, CONTACT INFORMATION
  const schools: ScrapedSchool[] = [];

  // Extract from the page text — the table renders as structured text
  const text = await page.evaluate(() => document.body.innerText);
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // Find the start of the provider list (after "Approved BDI Course Providers")
  let inProviderSection = false;
  let currentName = "";
  let currentDelivery = "";
  let currentPhone = "";
  let currentNotes = "";

  const phonePattern = /\d{3}[-.]?\d{3}[-.]?\d{4}/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes("Approved BDI Course Providers")) {
      inProviderSection = true;
      // Skip header row
      continue;
    }

    if (!inProviderSection) continue;

    // Stop at footer/copyright
    if (line.includes("PRIVACY STATEMENT") || line.includes("© Copyright")) break;

    // Skip header labels
    if (line === "NAME" || line === "DELIVERY METHOD" || line === "CONTACT INFORMATION") continue;
    if (line === "Provider's Website" || line === "Provider's Website") continue;

    // Phone number line
    if (phonePattern.test(line)) {
      currentPhone = line.match(phonePattern)![0];
      continue;
    }

    // Delivery method indicators
    if (
      line.match(/^(Classroom|Internet|DVD|Booklet|App|internet)/i) ||
      line.match(/^\(.*Languages.*\)$/i) ||
      line.match(/^\(Additional/i) ||
      line.match(/^\(Other/i)
    ) {
      if (currentDelivery) {
        currentDelivery += ", " + line;
      } else {
        currentDelivery = line;
      }
      continue;
    }

    // If we have accumulated a school and hit a new name-like line, flush
    if (currentName && line.length > 3 && !line.startsWith("(") && !phonePattern.test(line)) {
      // Save previous school
      const isOnline = currentDelivery.toLowerCase().includes("internet") ||
                       currentDelivery.toLowerCase().includes("app");
      schools.push({
        name: currentName,
        deliveryMethod: currentDelivery,
        phone: currentPhone,
        hasWebsite: true,
        notes: currentNotes,
      });

      // Start new school
      currentName = line;
      currentDelivery = "";
      currentPhone = "";
      currentNotes = "";

      // Check for county restrictions in parens
      const parenMatch = line.match(/\(([^)]+)\)/);
      if (parenMatch) {
        currentNotes = parenMatch[1];
        currentName = line.replace(/\s*\([^)]*\)\s*/g, "").trim();
      }
    } else if (!currentName) {
      // First school name
      currentName = line;
      const parenMatch = line.match(/\(([^)]+)\)/);
      if (parenMatch) {
        currentNotes = parenMatch[1];
        currentName = line.replace(/\s*\([^)]*\)\s*/g, "").trim();
      }
    }
  }

  // Flush last school
  if (currentName) {
    schools.push({
      name: currentName,
      deliveryMethod: currentDelivery,
      phone: currentPhone,
      hasWebsite: true,
      notes: currentNotes,
    });
  }

  await browser.close();
  console.log(`Scraped ${schools.length} FL BDI providers`);
  return schools;
}

async function getExistingFLSchools(): Promise<Map<string, string>> {
  const existing = new Map<string, string>();
  let cursor: string | undefined;

  do {
    const response: any = await notion.databases.query({
      database_id: DIRECTORY_DB,
      filter: { property: "State", select: { equals: "Florida" } },
      start_cursor: cursor,
      page_size: 100,
    });

    for (const page of response.results) {
      const name = (page as any).properties["School Name"]?.title?.[0]?.plain_text;
      if (name) existing.set(name.toLowerCase(), page.id);
    }

    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);

  console.log(`Found ${existing.size} existing FL schools in Notion`);
  return existing;
}

async function syncToNotion(scraped: ScrapedSchool[]) {
  const existing = await getExistingFLSchools();
  const TODAY = new Date().toISOString().split("T")[0];
  let created = 0, updated = 0;

  for (const school of scraped) {
    if (!school.name) continue;

    const isOnline = school.deliveryMethod.toLowerCase().includes("internet") ||
                     school.deliveryMethod.toLowerCase().includes("app");

    const properties: any = {
      "School Name": { title: [{ text: { content: school.name } }] },
      "License Number": {
        rich_text: [{ text: { content: "FL-BDI" } }],
      },
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

    const existingId = existing.get(school.name.toLowerCase());

    if (existingId) {
      await notion.pages.update({ page_id: existingId, properties });
      updated++;
    } else {
      await notion.pages.create({
        parent: { database_id: DIRECTORY_DB },
        properties,
      });
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
