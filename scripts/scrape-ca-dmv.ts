/**
 * Scrapes CA DMV traffic school data from the Salesforce Aura API at
 * drive.dmvonline.ca.gov. Queries each of California's 58 counties with
 * typeofInstruction=Internet, deduplicates by license number, and writes
 * data/ca-schools.json.
 */

import { writeFileSync, mkdirSync } from "fs";
import * as path from "path";

const AURA_URL = "https://drive.dmvonline.ca.gov/s/sfsites/aura";
const PAGE_URL = "https://drive.dmvonline.ca.gov/s/oll-traffic-schools?language=en_US";

// All 58 California counties
const CA_COUNTIES = [
  "Alameda", "Alpine", "Amador", "Butte", "Calaveras", "Colusa",
  "Contra Costa", "Del Norte", "El Dorado", "Fresno", "Glenn", "Humboldt",
  "Imperial", "Inyo", "Kern", "Kings", "Lake", "Lassen", "Los Angeles",
  "Madera", "Marin", "Mariposa", "Mendocino", "Merced", "Modoc", "Mono",
  "Monterey", "Napa", "Nevada", "Orange", "Placer", "Plumas", "Riverside",
  "Sacramento", "San Benito", "San Bernardino", "San Diego", "San Francisco",
  "San Joaquin", "San Luis Obispo", "San Mateo", "Santa Barbara", "Santa Clara",
  "Santa Cruz", "Shasta", "Sierra", "Siskiyou", "Solano", "Sonoma",
  "Stanislaus", "Sutter", "Tehama", "Trinity", "Tulare", "Tuolumne",
  "Ventura", "Yolo", "Yuba",
];

type AuraContext = {
  fwuid: string;
  loaded: Record<string, string>;
};

type SchoolRecord = {
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
  email: string;
  languages: string[];
  modalities: string[];
  licenseStart: string;
  licenseEnd: string;
};

/** Fetch the page HTML and extract the Aura framework context (fwuid + app hash). */
async function getAuraContext(): Promise<AuraContext> {
  console.log("Fetching Aura context from page...");
  const res = await fetch(PAGE_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; TrafficSchoolPicker/1.0)" },
  });
  if (!res.ok) throw new Error(`Failed to fetch page: ${res.status}`);
  const html = await res.text();

  // Extract fwuid from the page source
  const fwuidMatch = html.match(/"fwuid"\s*:\s*"([^"]+)"/);
  if (!fwuidMatch) throw new Error("Could not find fwuid in page HTML");

  // Extract the app loaded hash
  const loadedMatch = html.match(
    /"APPLICATION@markup:\/\/siteforce:communityApp"\s*:\s*"([^"]+)"/
  );
  if (!loadedMatch) throw new Error("Could not find app hash in page HTML");

  return {
    fwuid: fwuidMatch[1],
    loaded: { "APPLICATION@markup://siteforce:communityApp": loadedMatch[1] },
  };
}

/** Call the Salesforce Aura endpoint for a given county. */
async function queryCounty(
  county: string,
  ctx: AuraContext
): Promise<unknown[]> {
  const message = JSON.stringify({
    actions: [
      {
        id: "1;a",
        descriptor: "aura://ApexActionController/ACTION$execute",
        callingDescriptor: "UNKNOWN",
        params: {
          namespace: "",
          classname: "CADMV_OLSISDataRetieverController",
          method: "getTSLRecords",
          params: {
            businessCategory: "",
            address: "",
            businessName: "",
            postalCode: "",
            licenseNumber: "",
            city: "",
            typeofInstruction: "Internet",
            language: "",
            county,
          },
          cacheable: false,
          isContinuation: false,
        },
      },
    ],
  });

  const auraContext = JSON.stringify({
    mode: "PROD",
    fwuid: ctx.fwuid,
    app: "siteforce:communityApp",
    loaded: ctx.loaded,
    dn: [],
    globals: {},
    uad: true,
  });

  const body = new URLSearchParams({
    message,
    "aura.context": auraContext,
    "aura.pageURI": "/s/oll-traffic-schools?language=en_US",
    "aura.token": "null",
  });

  const res = await fetch(AURA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "User-Agent": "Mozilla/5.0 (compatible; TrafficSchoolPicker/1.0)",
    },
    body: body.toString(),
  });

  if (!res.ok) throw new Error(`Aura request failed for ${county}: ${res.status}`);

  const json = await res.json();
  const action = json?.actions?.[0];
  if (action?.state !== "SUCCESS") {
    throw new Error(
      `Aura action failed for ${county}: ${JSON.stringify(action?.error)}`
    );
  }

  return action.returnValue?.returnValue ?? [];
}

/** Parse a raw Salesforce record into our clean schema. */
function parseRecord(raw: Record<string, unknown>, county: string): SchoolRecord {
  const str = (key: string) => (raw[key] as string) ?? "";
  const languages = str("CADMV_LessonPlan_Language__c")
    .split(";")
    .map((l) => l.trim())
    .filter(Boolean);
  const modalities = str("CADMV_LessonPlan_Modality__c")
    .split(";")
    .map((m) => m.trim())
    .filter(Boolean);

  return {
    name: str("CADMV_BL_LicenseDisplayName__c"),
    licenseNumber: str("CADMV_BL_LicenseNumber__c"),
    phone: str("CADMV_BL_Acct_Phone__c"),
    website: str("CADMV_BL_Contact_Email__c"), // API uses email field; website not always present
    county: str("CADMV_BL_Acct_SiteCountyCode__c") || county,
    status: str("CADMV_BL_Status__c"),
    address: str("CADMV_BL_Acct_ShippingStreet__c"),
    city: str("CADMV_BL_Acct_shippingcity__c"),
    state: str("CADMV_BL_Acct_shippingstate__c"),
    zip: str("CADMV_BL_Acct_ShippingPostalCode__c"),
    email: str("CADMV_BL_Contact_Email__c"),
    languages,
    modalities,
    licenseStart: str("CADMV_BL_PeriodStart__c"),
    licenseEnd: str("CADMV_BL_PeriodEnd__c"),
  };
}

async function main() {
  const ctx = await getAuraContext();
  console.log(`Got Aura context (fwuid: ${ctx.fwuid.slice(0, 20)}...)`);

  const seen = new Map<string, SchoolRecord>();
  let totalRaw = 0;

  for (const county of CA_COUNTIES) {
    try {
      const records = await queryCounty(county, ctx);
      totalRaw += records.length;
      console.log(`  ${county}: ${records.length} records`);

      for (const raw of records) {
        const school = parseRecord(raw as Record<string, unknown>, county);
        if (school.licenseNumber && !seen.has(school.licenseNumber)) {
          seen.set(school.licenseNumber, school);
        }
      }
    } catch (err) {
      console.error(`  ${county}: ERROR - ${(err as Error).message}`);
    }

    // Be polite — 500ms between requests
    await new Promise((r) => setTimeout(r, 500));
  }

  const schools = Array.from(seen.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const outDir = path.join(process.cwd(), "data");
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "ca-schools.json");
  writeFileSync(outPath, JSON.stringify(schools, null, 2));

  console.log(
    `\nDone. ${totalRaw} raw records → ${schools.length} unique schools → ${outPath}`
  );
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
