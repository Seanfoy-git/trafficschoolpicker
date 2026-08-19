/**
 * Add I Drive Safely coverage for the 36-state IDS rollout (Schools DB
 * "State Codes" text field, comma-separated). Union with existing coverage;
 * never removes a state. Guarded: reads current value, prints the diff.
 *
 *   npx tsx scripts/add-ids-coverage.ts            # DRY RUN
 *   npx tsx scripts/add-ids-coverage.ts --apply    # write
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { makeNotionClient } from "./lib/notion-client";

const notion = makeNotionClient();
const SCHOOLS_DB = process.env.NOTION_SCHOOLS_DB!;
const APPLY = process.argv.includes("--apply");

/* eslint-disable @typescript-eslint/no-explicit-any */
// The 36 states approved for IDS in this rollout (from the brief table).
const ROLLOUT = [
  "AL","AK","AR","CO","CT","DE","DC","HI","ID","IA","KS","LA","MD","MA","MI","MN",
  "MS","MO","MT","NE","NH","NJ","ND","OH","OK","OR","RI","SD","TN","UT","VT","VA",
  "WA","WV","WI","WY",
];

function title(p: any): string {
  return p?.type === "title" ? p.title.map((t: any) => t.plain_text).join("") : "";
}
function richText(p: any): string {
  return p?.type === "rich_text" ? p.rich_text.map((t: any) => t.plain_text).join("") : "";
}

async function main() {
  console.log(APPLY ? "MODE: APPLY\n" : "MODE: DRY RUN\n");
  let cursor: string | undefined;
  let row: any = null;
  do {
    const r: any = await notion.databases.query({ database_id: SCHOOLS_DB, start_cursor: cursor, page_size: 100 });
    row = r.results.find((pg: any) => title(pg.properties["School Name"] ?? pg.properties["Name"]).trim() === "I Drive Safely");
    cursor = !row && r.has_more ? r.next_cursor : undefined;
  } while (cursor && !row);
  if (!row) { console.log("SKIP — 'I Drive Safely' row not found"); return; }

  const current = richText(row.properties["State Codes"]);
  const currentSet = current.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
  const union = Array.from(new Set([...currentSet, ...ROLLOUT])).sort();
  const added = ROLLOUT.filter((s) => !currentSet.includes(s));
  const value = union.join(",");

  console.log("current State Codes:", current);
  console.log("adding:", added.join(",") || "(none — already covered)");
  console.log("new State Codes:", value);

  if (APPLY) {
    await notion.pages.update({
      page_id: row.id,
      properties: { "State Codes": { rich_text: [{ text: { content: value } }] } },
    } as any);
    const after: any = await notion.pages.retrieve({ page_id: row.id });
    console.log("\nverify:", richText(after.properties["State Codes"]));
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
