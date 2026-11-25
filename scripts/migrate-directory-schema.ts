/**
 * School Directory schema for Visit-link provenance (17 Nov 2026). Dry run by
 * default; --apply writes. Idempotent.
 *
 *   1. Rename the date property "date:Enriched At:start" (a creation mistake) to "Enriched At".
 *   2. Add the select "Licence Status" (Active, Probation, Inactive).
 *   3. Backfill Licence Status on California rows from the status the CA sync
 *      used to write into Notes ("Status: Active", "Status: Probation",
 *      "Status: Inactive - not in DMV list as of …"). Rows whose Notes no longer
 *      say get theirs at the next CA sync. Only empty Licence Status is filled.
 *
 * Writes nothing else: no Notes, Website or provenance changes.
 *
 *   npx tsx scripts/migrate-directory-schema.ts [--apply]
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { makeNotionClient } from "./lib/notion-client";
import { directorySchema, LICENCE_STATUSES, loadDirectory, PROP, type LicenceStatus } from "./lib/directory-rows";

/* eslint-disable @typescript-eslint/no-explicit-any */
const notion: any = makeNotionClient();
const APPLY = process.argv.includes("--apply");
const OLD_ENRICHED_AT = "date:Enriched At:start";

function statusFromNotes(notes: string): LicenceStatus | null {
  const m = notes.match(/^Status:\s*(Active|Probation|Inactive)\b/i);
  return m ? (LICENCE_STATUSES.find((s) => s.toLowerCase() === m[1].toLowerCase()) ?? null) : null;
}

async function main() {
  const db = process.env.NOTION_DIRECTORY_DB!;
  const schema = await directorySchema(notion);
  const props: Record<string, unknown> = {};

  if (schema[OLD_ENRICHED_AT] && !schema[PROP.enrichedAt]) {
    props[OLD_ENRICHED_AT] = { name: PROP.enrichedAt };
    console.log(`1. rename "${OLD_ENRICHED_AT}" → "${PROP.enrichedAt}"`);
  } else console.log(`1. "${PROP.enrichedAt}": ${schema[PROP.enrichedAt] ? "already present" : "neither name present (nothing to rename)"}`);

  if (!schema[PROP.licenceStatus]) {
    props[PROP.licenceStatus] = { select: { options: [{ name: "Active", color: "green" }, { name: "Probation", color: "yellow" }, { name: "Inactive", color: "gray" }] } };
    console.log(`2. add select "${PROP.licenceStatus}" (${LICENCE_STATUSES.join(", ")})`);
  } else console.log(`2. "${PROP.licenceStatus}": already present (${schema[PROP.licenceStatus].options.join(", ")})`);

  if (APPLY && Object.keys(props).length) await notion.databases.update({ database_id: db, properties: props });

  const rows = await loadDirectory(notion);
  const backfill = rows
    .filter((r) => r.state === "California" && !r.licenceStatus)
    .map((r) => ({ r, status: statusFromNotes(r.notes) }))
    .filter((x): x is { r: (typeof rows)[number]; status: LicenceStatus } => x.status !== null);
  const counts: Record<string, number> = {};
  for (const { status } of backfill) counts[status] = (counts[status] ?? 0) + 1;
  console.log(`3. backfill Licence Status on ${backfill.length} California rows: ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(", ") || "none"}`);
  for (const { r, status } of backfill.filter((x) => x.status !== "Active")) console.log(`     ${r.licence} ${r.name} → ${status}`);

  if (APPLY) {
    for (const { r, status } of backfill) {
      await notion.pages.update({ page_id: r.id, properties: { [PROP.licenceStatus]: { select: { name: status } } } });
      await new Promise((res) => setTimeout(res, 350));
    }
  }
  console.log(APPLY ? "Applied." : "Dry run: nothing written. --apply to write.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
