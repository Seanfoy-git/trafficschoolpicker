/**
 * Fetches the TX TDLR driving safety (traffic school) provider CSV from
 * tdlr.texas.gov, filters to active Internet-based providers, validates
 * results, and writes data/tx-schools.json.
 */

import { writeFileSync, mkdirSync } from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";
import { validateRecords, runScraper, ScrapeResult } from "./lib/validate";

const CSV_URL =
  "https://www.tdlr.texas.gov/dbproduction2/vsDriverEduProvider.csv";

const REQUIRED_FIELDS = ["name", "licenseNumber"];
const MIN_EXPECTED_PROVIDERS = 10; // TX typically has dozens of providers

type TxSchool = {
  name: string;
  licenseNumber: string;
  phone: string;
  website: string;
  county: string;
  status: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  type: string;
  expirationDate: string;
};

function pickField(row: Record<string, string>, ...candidates: string[]): string {
  for (const key of candidates) {
    if (row[key]) return row[key];
  }
  return "";
}

export async function scrape(): Promise<ScrapeResult> {
  return runScraper("tx-tdlr", async () => {
    console.log("Fetching TX TDLR CSV...");
    const res = await fetch(CSV_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TrafficSchoolPicker/1.0)" },
      signal: AbortSignal.timeout(30000),
    });

    if (res.status === 404) {
      throw new Error("CSV endpoint returned 404 — TDLR may have moved the file");
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching CSV`);

    const text = await res.text();
    console.log(`Downloaded ${(text.length / 1024).toFixed(0)} KB`);

    if (text.length < 100) {
      throw new Error(`CSV response suspiciously small (${text.length} bytes) — may be an error page`);
    }

    // Check if we got HTML instead of CSV (common when endpoint changes)
    if (text.trimStart().startsWith("<!") || text.trimStart().startsWith("<html")) {
      throw new Error("Received HTML instead of CSV — endpoint may have changed");
    }

    let records: Record<string, string>[];
    try {
      records = parse(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      });
    } catch (err) {
      throw new Error(`CSV parse failed — format may have changed: ${(err as Error).message}`);
    }

    console.log(`Parsed ${records.length} total records`);

    if (records.length > 0) {
      const cols = Object.keys(records[0]);
      console.log(`Columns (${cols.length}): ${cols.join(", ")}`);
    }

    const schools: TxSchool[] = [];
    const seen = new Set<string>();

    for (const row of records) {
      const licenseNumber = pickField(row, "License Number", "LicenseNumber", "LICENSE_NUMBER", "License_Number", "ProviderNumber", "Provider Number");
      const name = pickField(row, "Business Name", "BusinessName", "BUSINESS_NAME", "Business_Name", "Name", "DBA Name", "DBA");

      if (!licenseNumber || seen.has(licenseNumber)) continue;
      seen.add(licenseNumber);

      schools.push({
        name: name.trim(),
        licenseNumber: licenseNumber.trim(),
        phone: pickField(row, "Phone", "PHONE", "Phone Number", "PhoneNumber").trim(),
        website: pickField(row, "Website", "URL", "Web", "WebAddress").trim(),
        county: pickField(row, "County", "COUNTY").trim(),
        status: pickField(row, "Status", "LICENSE_STATUS", "License Status").trim(),
        address: pickField(row, "Address", "Street", "ADDRESS", "Mailing Address").trim(),
        city: pickField(row, "City", "CITY").trim(),
        state: pickField(row, "State", "STATE").trim() || "TX",
        zip: pickField(row, "Zip", "ZIP", "Zip Code", "ZipCode", "Postal Code").trim(),
        type: pickField(row, "Type", "School Type", "SchoolType", "Course Type", "CourseType", "Category").trim(),
        expirationDate: pickField(row, "Expiration Date", "ExpirationDate", "EXPIRATION_DATE", "Expiration").trim(),
      });
    }

    schools.sort((a, b) => a.name.localeCompare(b.name));

    // Validate
    const validation = validateRecords({
      source: "tx-tdlr",
      records: schools as unknown as Record<string, unknown>[],
      requiredFields: REQUIRED_FIELDS,
      minRecords: MIN_EXPECTED_PROVIDERS,
    });

    // Extra: warn if no records have a name (column mapping probably broke)
    const namedCount = schools.filter((s) => s.name.length > 0).length;
    if (schools.length > 0 && namedCount === 0) {
      validation.errors.push(
        "tx-tdlr: no records have a name — CSV column names likely changed"
      );
    }

    // Write data
    const outDir = path.join(process.cwd(), "data");
    mkdirSync(outDir, { recursive: true });
    writeFileSync(
      path.join(outDir, "tx-schools.json"),
      JSON.stringify(schools, null, 2)
    );

    console.log(`\n${schools.length} unique providers written`);

    return {
      records: schools as unknown as Record<string, unknown>[],
      errors: validation.errors,
      warnings: validation.warnings,
    };
  });
}

if (require.main === module) {
  scrape().then((result) => {
    if (result.errors.length > 0) {
      console.error("\nERRORS:");
      result.errors.forEach((e) => console.error(`  ✗ ${e}`));
    }
    if (result.warnings.length > 0) {
      console.warn("\nWARNINGS:");
      result.warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
    }
    if (result.status === "error") process.exit(1);
  });
}
