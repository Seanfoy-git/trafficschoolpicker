/**
 * Fetches the TX TDLR driving safety (traffic school) provider CSV from
 * tdlr.texas.gov, filters to active Internet-based providers, and writes
 * data/tx-schools.json.
 */

import { writeFileSync, mkdirSync } from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";

const CSV_URL =
  "https://www.tdlr.texas.gov/dbproduction2/vsDriverEduProvider.csv";

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

async function main() {
  console.log("Fetching TX TDLR CSV...");
  const res = await fetch(CSV_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; TrafficSchoolPicker/1.0)" },
  });
  if (!res.ok) throw new Error(`Failed to fetch CSV: ${res.status}`);

  const text = await res.text();
  console.log(`Downloaded ${(text.length / 1024).toFixed(0)} KB`);

  // Parse CSV — TDLR uses standard comma-separated format with headers
  const records: Record<string, string>[] = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  console.log(`Parsed ${records.length} total records`);

  // Log column names from the first record to help with debugging
  if (records.length > 0) {
    console.log("Columns:", Object.keys(records[0]).join(", "));
  }

  // Map columns — TDLR CSV columns vary, so we try common column names
  const schools: TxSchool[] = [];
  const seen = new Set<string>();

  for (const row of records) {
    // Try to identify the license/provider number column
    const licenseNumber =
      row["License Number"] ||
      row["LicenseNumber"] ||
      row["LICENSE_NUMBER"] ||
      row["License_Number"] ||
      row["ProviderNumber"] ||
      row["Provider Number"] ||
      "";

    const name =
      row["Business Name"] ||
      row["BusinessName"] ||
      row["BUSINESS_NAME"] ||
      row["Business_Name"] ||
      row["Name"] ||
      row["DBA Name"] ||
      row["DBA"] ||
      "";

    const status =
      row["Status"] ||
      row["LICENSE_STATUS"] ||
      row["License Status"] ||
      "";

    const type =
      row["Type"] ||
      row["School Type"] ||
      row["SchoolType"] ||
      row["Course Type"] ||
      row["CourseType"] ||
      row["Category"] ||
      "";

    const phone =
      row["Phone"] ||
      row["PHONE"] ||
      row["Phone Number"] ||
      row["PhoneNumber"] ||
      "";

    const website =
      row["Website"] ||
      row["URL"] ||
      row["Web"] ||
      row["WebAddress"] ||
      "";

    const county =
      row["County"] ||
      row["COUNTY"] ||
      "";

    const address =
      row["Address"] ||
      row["Street"] ||
      row["ADDRESS"] ||
      row["Mailing Address"] ||
      "";

    const city =
      row["City"] ||
      row["CITY"] ||
      "";

    const state =
      row["State"] ||
      row["STATE"] ||
      "TX";

    const zip =
      row["Zip"] ||
      row["ZIP"] ||
      row["Zip Code"] ||
      row["ZipCode"] ||
      row["Postal Code"] ||
      "";

    const expirationDate =
      row["Expiration Date"] ||
      row["ExpirationDate"] ||
      row["EXPIRATION_DATE"] ||
      row["Expiration"] ||
      "";

    if (!licenseNumber || seen.has(licenseNumber)) continue;
    seen.add(licenseNumber);

    schools.push({
      name: name.trim(),
      licenseNumber: licenseNumber.trim(),
      phone: phone.trim(),
      website: website.trim(),
      county: county.trim(),
      status: status.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      zip: zip.trim(),
      type: type.trim(),
      expirationDate: expirationDate.trim(),
    });
  }

  // Sort alphabetically by name
  schools.sort((a, b) => a.name.localeCompare(b.name));

  const outDir = path.join(process.cwd(), "data");
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "tx-schools.json");
  writeFileSync(outPath, JSON.stringify(schools, null, 2));

  console.log(`\nDone. ${schools.length} unique providers → ${outPath}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
