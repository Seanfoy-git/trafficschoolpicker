/**
 * One-time setup for the price-review workflow:
 *   1. Add a "Price Locked" checkbox to the Scraper Rules DB.
 *   2. Lock the two chronic multi-tier targets (aceable-TX, idrivesafely-TX):
 *      their Verified Price is authoritative and the page scrape grabs the wrong
 *      tier, so band-checking them only produces daily false "Needs Review".
 *   3. Write the review SOP into the Pricing DB description, and a short
 *      "Price Locked" note into the Rules DB description.
 *
 *   npx tsx scripts/setup-price-review.ts            # DRY RUN
 *   npx tsx scripts/setup-price-review.ts --apply    # write
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { makeNotionClient } from "./lib/notion-client";

const notion = makeNotionClient();
const RULES_DB = process.env.NOTION_SCRAPER_RULES_DB!;
const PRICING_DB = process.env.NOTION_PRICING_DB!;
const APPLY = process.argv.includes("--apply");

/* eslint-disable @typescript-eslint/no-explicit-any */
const rt = (p: any) => p?.rich_text?.map((t: any) => t.plain_text).join("") ?? "";

// Rows to lock: [schoolSlug, stateCode].
const LOCK: [string, string][] = [
  ["aceable", "TX"],
  ["idrivesafely", "TX"],
];

const PRICING_SOP =
  "📋 SOP — handling “Needs Review” prices\n\n" +
  "Daily at 13:00 UTC the scraper checks each monetized price against the Scraper Rules DB. " +
  "A scrape that disagrees with the verified price/band sets this row's Price Scrape Status to " +
  "“Needs Review” (the live price is NOT changed) and opens/updates the GitHub issue " +
  "“🔎 Prices to review”.\n\n" +
  "When the issue fires, per flagged target:\n" +
  "1. Open its row in the SCRAPER RULES DB (not here).\n" +
  "2. Check the school's live page.\n" +
  "   • Real price change → update Verified Price + Expected Min/Max to the new price.\n" +
  "   • Wrong-tier / noise, verified price still correct → tick “Price Locked” " +
  "(offers keep updating; the price band-check stops for that row).\n" +
  "3. The next run rebuilds the issue from scratch: fixed lines drop off and it auto-closes when clean. " +
  "Don't just close the issue — if the mismatch remains it reopens.\n\n" +
  "Offers (Sale Price) auto-expire 3 days after last seen unless set manually. Silence from the bot = all clear.";

const RULES_NOTE =
  "Price Locked ✔ = the Verified Price is authoritative; the daily scrape stops band-checking this " +
  "row (no more “Needs Review” nags) but still reads live offers. Use for multi-tier pages where " +
  "the price scrape grabs the wrong tier (e.g. aceable-TX, idrivesafely-TX). Untick to un-mute.";

async function all(db: string): Promise<any[]> {
  let c: string | undefined;
  const out: any[] = [];
  do {
    const r: any = await notion.databases.query({ database_id: db, start_cursor: c, page_size: 100 });
    out.push(...r.results);
    c = r.has_more ? r.next_cursor : undefined;
  } while (c);
  return out;
}

async function main() {
  console.log(APPLY ? "MODE: APPLY\n" : "MODE: DRY RUN\n");

  // 1. Add the Price Locked property (idempotent — Notion no-ops if it exists).
  console.log("1. Add 'Price Locked' checkbox to Rules DB");
  if (APPLY) {
    await notion.databases.update({
      database_id: RULES_DB,
      properties: { "Price Locked": { checkbox: {} } },
    } as any);
    console.log("   ✓ property present");
  }

  // 2. Lock the chronic targets.
  console.log("\n2. Lock chronic multi-tier targets");
  const rules = await all(RULES_DB);
  for (const [slug, state] of LOCK) {
    const row = rules.find(
      (r) =>
        rt(r.properties["School Slug"]).trim().toLowerCase() === slug &&
        rt(r.properties["State Code"]).trim().toUpperCase() === state
    );
    if (!row) { console.log(`   SKIP ${slug}-${state} — no rule row found`); continue; }
    const cur = row.properties["Price Locked"]?.checkbox ?? false;
    console.log(`   ${slug}-${state}: Price Locked ${cur} → true`);
    if (APPLY) {
      await notion.pages.update({ page_id: row.id, properties: { "Price Locked": { checkbox: true } } } as any);
    }
  }

  // 3. Descriptions (SOP + note).
  console.log("\n3. Write SOP into Pricing DB + note into Rules DB descriptions");
  if (APPLY) {
    await notion.databases.update({
      database_id: PRICING_DB,
      description: [{ type: "text", text: { content: PRICING_SOP } }],
    } as any);
    await notion.databases.update({
      database_id: RULES_DB,
      description: [{ type: "text", text: { content: RULES_NOTE } }],
    } as any);
    console.log("   ✓ descriptions written");
  } else {
    console.log(`   Pricing DB SOP (${PRICING_SOP.length} chars), Rules DB note (${RULES_NOTE.length} chars)`);
  }

  console.log(APPLY ? "\nDone." : "\nDry run only — re-run with --apply to write.");
}
main().catch((e) => { console.error(e); process.exit(1); });
