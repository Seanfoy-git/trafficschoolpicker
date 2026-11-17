/**
 * DATA FLOW: Google Places API → Notion School Directory → Site (Visit links)
 *
 * Finds the website of directory schools that have none (the CA, TX, FL, GA and
 * AZ lists publish no website). Since 17 Nov 2026 a Places result is accepted
 * only when it is proved to be the row's school (scripts/lib/places-match):
 * street number + ZIP in its address, or (no street address) the school's
 * distinctive name words. Otherwise the row gets no website: a wrong Visit link
 * is worse than none. A place ID another school (different licence and address)
 * already holds is rejected.
 *
 * Writes only: Website (when found), Google Place ID, Website Source = Google
 * Places, Enrichment Status (Enriched | Not Found), Enriched At. Never Notes.
 * Never touches a row a person set: Website Source = Manual, or Enrichment
 * Status = Manual / Skipped. A row looked up in the last 180 days is not
 * looked up again.
 *
 *   npx tsx scripts/enrich-places.ts                 # dry run: lookups, no writes
 *   npx tsx scripts/enrich-places.ts --apply         # write (monthly-update.yml)
 *   npx tsx scripts/enrich-places.ts --only E1008,E0893 [--include-hand-set]
 *        look up just these licences; --include-hand-set (dry run only) evaluates
 *        hand-set rows too, to show what the matcher would do, without writing
 *
 * Cost: scripts/lib/places-client (Text Search Pro + Place Details Enterprise).
 * Rate limits: Places 10 QPS (150 ms between rows); Notion 3 req/s (350 ms per write).
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { makeNotionClient } from "./lib/notion-client";
import { directorySchema, isHandSet, loadDirectory, PROP, type DirRow } from "./lib/directory-rows";
import { cost, usage } from "./lib/places-client";
import { holdingsOf, lookup } from "./lib/places-lookup";

const notion = makeNotionClient();
const APPLY = process.argv.includes("--apply");
const INCLUDE_HAND_SET = process.argv.includes("--include-hand-set");
const onlyArg = process.argv.find((a, i) => process.argv[i - 1] === "--only");
const ONLY = onlyArg ? new Set(onlyArg.split(",").map((s) => s.trim().toUpperCase())) : null;
const RETRY_AFTER_DAYS = 180;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const daysSince = (iso: string) => (Date.now() - new Date(iso).getTime()) / 86_400_000;

/** Properties this script writes, and the select options it uses: fail closed if the schema lacks one. */
const NEEDS: [string, string, string[]][] = [
  [PROP.placeId, "rich_text", []],
  [PROP.websiteSource, "select", ["Google Places"]],
  [PROP.enrichmentStatus, "select", ["Enriched", "Not Found"]],
  [PROP.enrichedAt, "date", []],
];

function pending(rows: DirRow[]): DirRow[] {
  return rows.filter((r) => {
    if (ONLY) return ONLY.has(r.licence.toUpperCase()) && (INCLUDE_HAND_SET || !isHandSet(r));
    if (!r.onlineAvailable || r.website || isHandSet(r) || !r.name) return false;
    return !(r.enrichedAt && daysSince(r.enrichedAt) < RETRY_AFTER_DAYS);
  });
}

async function main() {
  if (INCLUDE_HAND_SET && APPLY) {
    console.error("--include-hand-set is dry-run only: hand-set rows are never written.");
    process.exit(1);
  }
  const schema = await directorySchema(notion);
  const missing = NEEDS.filter(([n, t, opts]) => schema[n]?.type !== t || opts.some((o) => !schema[n].options.includes(o)));
  if (missing.length) {
    const msg = `School Directory schema lacks ${missing.map(([n, t, o]) => `"${n}" (${t}${o.length ? `: ${o.join(", ")}` : ""})`).join("; ")}. Run scripts/migrate-directory-schema.ts first.`;
    // Writing would fail row by row; a dry run writes nothing, so it can go on.
    if (APPLY) {
      console.error(`::error::${msg}`);
      process.exit(1);
    }
    console.warn(`(dry run) ${msg}`);
  }

  const rows = await loadDirectory(notion);
  const holdings = holdingsOf(rows);
  const todo = pending(rows);
  console.log(`${APPLY ? "APPLY" : "DRY RUN (no writes; --apply to write)"}: ${todo.length} of ${rows.length} directory rows to look up.`);
  if (!todo.length) return;
  const ts = cost(todo.length, "textSearchPro");
  const det = cost(todo.length, "placeDetailsEnterprise");
  console.log(`  Cost at most: Text Search Pro $${ts.gross.toFixed(2)} ($${ts.afterFree.toFixed(2)} after 5,000 free/month) + Place Details $${det.gross.toFixed(2)} ($${det.afterFree.toFixed(2)} after 1,000 free/month)\n`);

  const today = new Date().toISOString().slice(0, 10);
  let enriched = 0, notFound = 0, failed = 0;
  for (const row of todo) {
    try {
      const res = await lookup(row, holdings);
      const props: Record<string, unknown> = {
        [PROP.enrichedAt]: { date: { start: today } },
        [PROP.enrichmentStatus]: { select: { name: res.found ? "Enriched" : "Not Found" } },
      };
      if (res.found) {
        props[PROP.placeId] = { rich_text: [{ text: { content: res.candidate.id } }] };
        if (res.website) {
          props.Website = { url: res.website };
          props[PROP.websiteSource] = { select: { name: "Google Places" } };
        }
        // Later rows in this run see this hold (1c).
        holdings.set(res.candidate.id, [...(holdings.get(res.candidate.id) ?? []), row]);
        enriched++;
        console.log(`  OK   ${row.licence} ${row.name} → ${res.website ?? "(listing has no website)"} [${res.rule}, ${res.evidence} evidence: ${res.candidate.displayName}, ${res.candidate.formattedAddress}]`);
      } else {
        notFound++;
        // Address only (a listing at the row's address without its name) is Not Found too; logged with both names.
        const detail = res.addressOnly.length
          ? ` | ${res.addressOnly.map((c) => `${c.displayName} (${c.id}), ${c.formattedAddress}${res.websites[c.id] ? `, ${res.websites[c.id]}` : ""}`).join("; ")}`
          : res.candidates.length ? ` | top: ${res.candidates[0].displayName} (${res.candidates[0].id}), ${res.candidates[0].formattedAddress}` : "";
        console.log(`  --   ${row.licence} ${row.name} (${row.address || "no address"}) → no website: ${res.reason}${detail}`);
      }
      if (APPLY && !isHandSet(row)) {
        await notion.pages.update({ page_id: row.id, properties: props as never });
        await sleep(350);
      }
    } catch (err) {
      failed++;
      console.error(`  ERR  ${row.licence} ${row.name}: ${(err as Error).message}`);
    }
    await sleep(150);
  }

  const spent = cost(usage.textSearch, "textSearchPro").gross + cost(usage.details, "placeDetailsEnterprise").gross;
  console.log(`\nEnrichment ${APPLY ? "complete" : "dry run"}: ${enriched} matched, ${notFound} not found, ${failed} failed.`);
  console.log(`  Calls: ${usage.textSearch} Text Search Pro, ${usage.details} Place Details (list price $${spent.toFixed(2)} before free calls)`);
  if (failed) process.exitCode = 1;
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
