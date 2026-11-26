/**
 * Texas directory: TDLR's licensed driving safety course providers.
 *
 * Source: TDLR "Download License Files" (tdlr.texas.gov/LicenseSearch/licfile.asp),
 * file "Driver Safety Providers", vsDriverSafetyProvider.csv. One row per licence:
 * License Number (CP###), Profession ("DRIVING SAFETY PROVIDER"), License Status,
 * Licensee, License Expiration Date, Address 1, Address 2, City, State, County,
 * Zip, Phone. TDLR updates the files daily.
 *
 * Until 25 Nov 2026 this script read vsDriverEduProvider.csv, TDLR's driver
 * EDUCATION provider file (C-numbered schools, ISDs, parent-taught courses), and
 * kept every row because that file has no type column. So /texas listed 845
 * "online traffic schools" that were driver-ed licences, and the approval gate
 * used them as evidence. The old rows keep Source "TX TDLR" (hidden by
 * lib/directory-filter, still read for their hand-set prices in the comparison);
 * this list writes Source "TX TDLR DSC" and matches, guards and delists only its
 * own rows (syncToNotion ownSourceOnly).
 *
 * Writes through syncToNotion, so the shrink guard, delisting and the run summary
 * for the directory health check apply. A fetch that still fails after retries is
 * recorded as an error, so the health check flags Texas the same day.
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { syncToNotion, recordScrapeResult, type ScrapedSchool } from "./lib/scraper-utils";

const CSV_URL = "https://www.tdlr.texas.gov/dbproduction2/vsDriverSafetyProvider.csv";
export const TX_DSC_SOURCE = "TX TDLR DSC";

/**
 * Licences left out of the directory. CP1425 is Pellucid Media's own course (The
 * Texas Course). Whether TSP lists it is Sean's parked decision (tsp-open-items,
 * "Should The Texas Course ever be listed on TSP?"), so it stays out until he decides.
 */
const EXCLUDED_LICENCES = new Set(["CP1425"]);

const RETRY_DELAYS_MS = [5_000, 20_000, 60_000];

/** RFC 4180: quoted fields may hold commas ("I DRIVE SAFELY, LLC") and doubled quotes. */
export function parseCsv(text: string): Record<string, string>[] {
  const records: string[][] = [];
  let field = "";
  let row: string[] = [];
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f.trim())) records.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim())) records.push(row);
  const [header, ...rest] = records;
  if (!header) return [];
  const keys = header.map((h) => h.trim());
  return rest.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").replace(/ /g, " ").trim()])));
}

async function fetchCsv(): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const res = await fetch(CSV_URL, { signal: AbortSignal.timeout(60_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (/^\s*</.test(text)) throw new Error("got HTML, not CSV: the file has moved");
      return text;
    } catch (err) {
      lastErr = err;
      const wait = RETRY_DELAYS_MS[attempt];
      if (wait === undefined) break;
      console.warn(`  TDLR fetch failed (${(err as Error).message}), retrying in ${wait / 1000}s`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

export function toSchools(rows: Record<string, string>[]): ScrapedSchool[] {
  return rows
    .filter((r) => r["Profession"]?.toUpperCase() === "DRIVING SAFETY PROVIDER")
    .filter((r) => r["License Status"]?.toUpperCase() === "CURRENT")
    .filter((r) => r["License Number"] && !EXCLUDED_LICENCES.has(r["License Number"].toUpperCase()))
    .map((r) => ({
      // Some providers are licensed under a web address; "WWW.CHEAPDRIVINGCOURSE.COM"
      // would otherwise be dropped as page furniture by the shared junk filter.
      name: r["Licensee"].replace(/^www\./i, ""),
      licenseNumber: r["License Number"],
      phone: r["Phone"] ?? "",
      address: [r["Address 1"], r["Address 2"], r["City"], r["State"], r["Zip"]].filter(Boolean).join(", "),
      website: "",
      // The file doesn't say whether a provider's course is online, so no claim either way.
      onlineAvailable: false,
      notes: "",
    }));
}

async function main() {
  console.log("Texas: TDLR driving safety course providers");
  let text: string;
  try {
    text = await fetchCsv();
  } catch (err) {
    const message = (err as Error).message;
    console.error(`  Texas: TDLR file unreachable after retries: ${message}`);
    recordScrapeResult({ state: "Texas", code: "TX", scraped: 0, valid: 0, held: 0, created: 0, updated: 0, status: "error", note: message });
    process.exit(1);
  }
  const rows = parseCsv(text);
  const schools = toSchools(rows);
  console.log(`  ${rows.length} licences in the file, ${schools.length} current driving safety providers (excluding ${[...EXCLUDED_LICENCES].join(", ")})`);
  await syncToNotion(schools, "Texas", TX_DSC_SOURCE, "TX", { ownSourceOnly: true });
}

if (process.argv[1]?.endsWith("scrape-tx-tdlr.ts")) {
  main().catch((err) => {
    console.error("Fatal:", err);
    recordScrapeResult({ state: "Texas", code: "TX", scraped: 0, valid: 0, held: 0, created: 0, updated: 0, status: "error", note: (err as Error).message });
    process.exit(1);
  });
}
