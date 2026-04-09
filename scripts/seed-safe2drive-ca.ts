/**
 * Seeds the safe2drive:CA locked variant as a ground-truth test case.
 * This row is Locked — the generator will never overwrite it.
 *
 * Usage: npx tsx scripts/seed-safe2drive-ca.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DB_ID = process.env.NOTION_SCHOOL_VARIANTS_DB!;

if (!process.env.NOTION_TOKEN || !DB_ID) {
  console.error("Missing NOTION_TOKEN or NOTION_SCHOOL_VARIANTS_DB");
  process.exit(1);
}

const TODAY = new Date().toISOString().split("T")[0];

function richText(text: string) {
  return { rich_text: [{ text: { content: text } }] };
}

function title(text: string) {
  return { title: [{ text: { content: text } }] };
}

async function main() {
  const KEY = "safe2drive:CA";

  // Check if it already exists
  const existing: any = await notion.databases.query({
    database_id: DB_ID,
    filter: { property: "Name", title: { equals: KEY } },
    page_size: 1,
  });

  const properties: any = {
    "Name": title(KEY),
    "School Slug": richText("safe2drive"),
    "State Code": { select: { name: "CA" } },
    "Generation Status": { select: { name: "Locked" } },
    "Lock Reason": richText("Manually verified by affiliate rep (Safe2Drive) 2026-04-09. CA has final exam (open-book, 2 attempts), DMV-licensed #E1854, $24.95 price."),
    "One Liner": richText("DMV-licensed traffic school — open-book exam, no lesson timers, $24.95"),
    "Pros": richText("DMV-licensed in CA (#E1854)|Open-book final exam — most pass first try|No lesson timers — complete at your own pace|Electronic certificate to court same day|7-day customer support|Money-back guarantee"),
    "Cons": richText("Final exam required (2 attempts)|Limited brand recognition vs nationals|Court admin fee charged separately by county"),
    "Best For": richText("CA drivers who want a no-frills, legitimate online traffic school at a fair price"),
    "Not For": richText("Drivers outside Safe2Drive's covered states"),
    "Price Override": { number: 24.95 },
    "Generation Notes": richText("Manually seeded — ground-truth test case"),
    "Last Generated": { date: { start: TODAY } },
  };

  if (existing.results.length > 0) {
    const pageId = existing.results[0].id;
    console.log(`Updating existing row: ${KEY} (${pageId})`);
    await notion.pages.update({ page_id: pageId, properties });
  } else {
    console.log(`Creating new row: ${KEY}`);
    await notion.pages.create({
      parent: { database_id: DB_ID },
      properties,
    });
  }

  console.log("Done. safe2drive:CA locked variant seeded.");
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
