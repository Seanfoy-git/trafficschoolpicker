/**
 * WS2 Step 1 — sync each Scraper Rules Verified Price into its Pricing-DB row so
 * Pricing holds the verified value BEFORE the render flip (Pricing above column).
 * Guarded: reads current, writes Verified Price (Approved, status OK), reads back
 * to verify. Also reverts TicketSchool-FL Pricing to $24.95 (operator choice (b):
 * don't promote an unverified $29 onto an unmonetized card).
 *
 *   npx tsx scripts/sync-verified-prices.ts            # DRY RUN → change list
 *   npx tsx scripts/sync-verified-prices.ts --apply
 */
import { config } from "dotenv"; config({ path: ".env.local" });
import { makeNotionClient } from "./lib/notion-client";
import { fetchVerifiedRules } from "./config/scraper-rules";

const notion = makeNotionClient();
const APPLY = process.argv.includes("--apply");
const PRICING_DB = process.env.NOTION_PRICING_DB!;
/* eslint-disable @typescript-eslint/no-explicit-any */

async function getRow(label: string): Promise<{ id: string | null; price: number | null }> {
  const r: any = await notion.databases.query({
    database_id: PRICING_DB, filter: { property: "Label", title: { equals: label } }, page_size: 1,
  });
  const row = r.results[0];
  return { id: row?.id ?? null, price: row?.properties?.["Price"]?.number ?? null };
}

let changed = 0, skipped = 0;
async function writePrice(label: string, target: number, note: string, assertCurrent?: number) {
  const row = await getRow(label);
  if (!row.id) { console.log(`  SKIP ${label} — no pricing row`); skipped++; return; }
  if (assertCurrent !== undefined && row.price !== assertCurrent) {
    console.log(`  SKIP ${label} — current $${row.price} ≠ expected $${assertCurrent} (drift)`); skipped++; return;
  }
  if (row.price === target) { console.log(`  noop ${label} — already $${target}`); return; }
  console.log(`  ${APPLY ? "WRITE" : "would write"} ${label}: $${row.price ?? "—"} → $${target}   [${note}]`);
  if (APPLY) {
    await notion.pages.update({ page_id: row.id, properties: {
      Price: { number: target }, Approved: { checkbox: true }, "Price Scrape Status": { select: { name: "OK" } },
    } });
    const back: any = await notion.pages.retrieve({ page_id: row.id });
    if (back.properties["Price"]?.number !== target) throw new Error(`verify failed: ${label}`);
    changed++;
  }
}

async function main() {
  console.log(APPLY ? "MODE: APPLY\n" : "MODE: DRY RUN (change list only)\n");
  const rules = await fetchVerifiedRules(notion);

  console.log("── Sync Verified Price → Pricing (per rule) ──");
  for (const r of rules) {
    if (r.verifiedPrice == null) { console.log(`  SKIP ${r.schoolSlug}-${r.state} — rule has no Verified Price`); skipped++; continue; }
    await writePrice(`${r.schoolSlug}-${r.state}`, r.verifiedPrice, `verified: ${r.ruleName}`);
  }

  console.log("\n── TicketSchool-FL revert (operator choice b) ──");
  await writePrice("ticketschool-FL", 24.95, "revert unverified $29 → $24.95", 29);

  console.log(`\n${APPLY ? `Applied ${changed}, skipped ${skipped}.` : `Dry run — approve, then re-run with --apply.`}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
