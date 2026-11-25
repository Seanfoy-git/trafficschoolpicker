/**
 * DIRECTORY VISIT-LINK GATE (prebuild, 17 Nov 2026). A non-zero exit fails the build.
 *
 * The 1 Nov enrichment gave unrelated schools one school's Google listing
 * (E1008, E0893 and E0954 all linked to 5dollartrafficschool.com). One Places
 * listing is one business at one address, so:
 *
 *   FAIL 1  two rows with Website Source = Google Places share a Google Place ID
 *           and differ in BOTH licence and address (two schools, one listing).
 *           Where a licence is a placeholder ("UT-approved"), the school name
 *           stands in for it (places-match differentSchools).
 *   FAIL 2  (once REQUIRE_WEBSITE_SOURCE is on, after the held states' scrapers
 *           are fixed and those states re-checked) a row has a Website and no
 *           Website Source: a link nobody can account for.
 *
 *   npx tsx scripts/verify-directory-links.ts
 *   npx tsx scripts/verify-directory-links.ts --plant   # self-test: plants one FAIL 1
 *        violation in memory (no Notion write) and must exit 1
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { loadDirectory, type DirRow } from "./lib/directory-rows";
import { differentSchools, normAddress, normLicence } from "./lib/places-match";

/**
 * Off until every state is finished: the re-check apply (PR B) leaves the held
 * states (NY, VA, NV, MD, ND, WA; broken scrapers) untouched, so their websites
 * still have no source. The PR that fixes those scrapers and finishes those
 * states turns this on.
 */
const REQUIRE_WEBSITE_SOURCE = false;

export function sharedListings(rows: DirRow[]): { placeId: string; rows: DirRow[] }[] {
  const by = new Map<string, DirRow[]>();
  for (const r of rows) {
    if (r.websiteSource !== "Google Places" || !r.placeId) continue;
    by.set(r.placeId, [...(by.get(r.placeId) ?? []), r]);
  }
  const out: { placeId: string; rows: DirRow[] }[] = [];
  for (const [placeId, group] of by) {
    const clash = group.some((a, i) =>
      group.slice(i + 1).some((b) => differentSchools(a, b)),
    );
    if (clash) out.push({ placeId, rows: group });
  }
  return out;
}

async function main() {
  if (!process.env.NOTION_TOKEN || !process.env.NOTION_DIRECTORY_DB) {
    console.error("❌ Directory links: NOTION_TOKEN / NOTION_DIRECTORY_DB not set");
    process.exit(1);
  }
  const rows = await loadDirectory();
  if (process.argv.includes("--plant")) {
    // Two different schools (different licence and address) given one listing.
    const a = rows.find((r) => r.licence && r.address)!;
    const b = rows.find((r) => r.licence && r.address && normLicence(r.licence) !== normLicence(a.licence) && normAddress(r.address) !== normAddress(a.address))!;
    const planted = "PLANTED_TEST_PLACE_ID";
    for (const r of [a, b]) Object.assign(r, { placeId: planted, websiteSource: "Google Places", website: r.website || "https://example.com/" });
    console.log(`(plant: ${a.licence} and ${b.licence} given place ${planted}, in memory only)`);
  }

  const problems: string[] = [];
  for (const { placeId, rows: group } of sharedListings(rows)) {
    problems.push(`Google Place ID ${placeId} is the Visit link source for ${group.length} different schools: ${group.map((r) => `${r.state} ${r.licence || "?"} ${r.name} (${r.address || "no address"}) → ${r.website}`).join("; ")}`);
  }
  const unsourced = rows.filter((r) => r.website && !r.websiteSource);
  if (REQUIRE_WEBSITE_SOURCE) {
    for (const r of unsourced) problems.push(`${r.state} ${r.licence || "?"} ${r.name} has Website ${r.website} and no Website Source`);
  }

  if (problems.length) {
    console.error(`❌ Directory links: ${problems.length} problem(s)`);
    for (const p of problems.slice(0, 50)) console.error(`  - ${p}`);
    if (problems.length > 50) console.error(`  … and ${problems.length - 50} more`);
    console.error("  Fix in the School Directory (Notion): clear the wrong Website, or set the right one with Website Source = Manual.");
    process.exit(1);
  }
  console.log(`✅ Directory links: ${rows.length} rows, no shared Google listing across schools${REQUIRE_WEBSITE_SOURCE ? ", every Website has a source" : ` (${unsourced.length} websites without a source; enforced after the re-check)`}.`);
}

main().catch((err) => {
  console.error("❌ Directory links:", (err as Error).message);
  process.exit(1);
});
