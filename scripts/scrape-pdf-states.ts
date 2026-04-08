/**
 * Scrapes school data from state-published PDF files.
 * Downloads the PDF, extracts text, parses school records, syncs to Notion.
 *
 * Currently handles: OK, MN, WY, RI
 * ID and NC PDFs are 404 — those states need alternative sources.
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import pdf from "pdf-parse";
import { ScrapedSchool, syncToNotion } from "./lib/scraper-utils";
import { logIssue, flushIssues } from "./lib/issues";

interface PdfSource {
  stateCode: string;
  stateName: string;
  sourceLabel: string;
  url: string;
  parser: (text: string) => ScrapedSchool[];
}

// ─── PARSERS ────────────────────────────────────────────────

function parseOklahoma(text: string): ScrapedSchool[] {
  const schools: ScrapedSchool[] = [];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const phonePattern = /^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{3,4}$/;
  const pagePattern = /^(Friday|Monday|Tuesday|Wednesday|Thursday|Saturday|Sunday),/;

  for (let i = 0; i < lines.length; i++) {
    if (phonePattern.test(lines[i]) && i >= 2) {
      // Phone → City is line before → Address before that → Name before that
      let nameIdx = i - 3;
      // Skip city and address lines
      const city = lines[i - 1] ?? "";
      const address = lines[i - 2] ?? "";
      let name = lines[i - 3] ?? "";

      // Skip page headers
      if (pagePattern.test(name) || name.includes("Page ") || name.includes("Oklahoma Department")) {
        continue;
      }

      if (name.length > 2) {
        schools.push({
          name,
          licenseNumber: "OK-DPS",
          phone: lines[i],
          address: `${address}, ${city}, OK`,
          website: "",
          onlineAvailable: false,
          notes: "",
        });
      }
    }
  }
  return schools;
}

function parseMinnesota(text: string): ScrapedSchool[] {
  const schools: ScrapedSchool[] = [];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const phonePattern = /\d{3}[-.]?\d{3}[-.]?\d{4}/;

  // MN format: Name\nAddress lines\nPhone\nCheckmarks for classroom/online
  let currentName = "";
  let currentAddress = "";
  let currentPhone = "";
  let currentWebsite = "";
  let isOnline = false;

  for (const line of lines) {
    if (line.includes("Page ") || line.includes("Minnesota Department") || line.includes("Visit us:") || line.includes("Approved accident")) continue;
    if (line === "Name and address" || line === "Phone" || line.includes("hour")) continue;

    const phoneMatch = line.match(phonePattern);
    if (phoneMatch && currentName) {
      currentPhone = phoneMatch[0];
      schools.push({
        name: currentName,
        licenseNumber: "MN-DPS",
        phone: currentPhone,
        address: currentAddress,
        website: currentWebsite,
        onlineAvailable: isOnline,
        notes: "",
      });
      currentName = "";
      currentAddress = "";
      currentPhone = "";
      currentWebsite = "";
      isOnline = false;
    } else if (line.startsWith("www.") || line.startsWith("http")) {
      currentWebsite = line;
      isOnline = line.toLowerCase().includes("online") || true;
    } else if (line.match(/^[A-Z]/) && line.length > 5 && !line.match(/^\d/) && !line.includes(",") && !currentName) {
      currentName = line;
    } else if (currentName && !currentPhone) {
      currentAddress += (currentAddress ? ", " : "") + line;
    }
  }
  return schools;
}

function parseWyoming(text: string): ScrapedSchool[] {
  const schools: ScrapedSchool[] = [];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // WY format: PROGRAM NAME ADDRESS CITY STATE ZIP [EXPIRATION DATE]
  // Header: PROGRAM NAME | ADDRESS | CITY | STATE | ZIP CODE | EXPIRATION DATE
  let headerFound = false;

  for (const line of lines) {
    if (line.includes("PROGRAM NAME")) { headerFound = true; continue; }
    if (!headerFound) continue;
    if (line.includes("APPROVED DRIVER")) continue;

    // Parse: name ends where address starts (address has numbers)
    // These are space-separated columns in the PDF
    const match = line.match(/^(.+?)\s+(\d+.+?)\s+(WY)\s+(\d{5})/);
    if (match) {
      const fullBefore = match[1];
      // Split name from address — name is before the street number
      const addrStart = fullBefore.search(/\d+\s+\w/);
      let name, address, city;
      if (addrStart > 3) {
        name = fullBefore.slice(0, addrStart).trim();
        const rest = fullBefore.slice(addrStart).trim();
        // City is the last word(s) before state
        address = rest;
        city = "";
      } else {
        name = fullBefore;
        address = "";
        city = "";
      }

      if (name.length > 3) {
        schools.push({
          name,
          licenseNumber: "WY-WDE",
          phone: "",
          address: `${address} ${match[3]} ${match[4]}`.trim(),
          website: "",
          onlineAvailable: false,
          notes: "",
        });
      }
    }
  }
  return schools;
}

function parseRhodeIsland(text: string): ScrapedSchool[] {
  const schools: ScrapedSchool[] = [];
  const text2 = text.replace(/\n/g, " ");
  const phonePattern = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

  // RI format: LICENSE#NAME\nADDRESS PHONE EXP
  // Pattern: number then school name, then address, then phone
  const schoolPattern = /(\d{1,3})([A-Z][A-Za-z'\s.&]+(?:LLC|Inc|INC|School|SCHOOL|AUTO|Driving|DRIVING|Education|Academy)[A-Za-z'\s.&]*)\s+(\d+[^(]*?)\s+(\(\d{3}\)\s*\d{3}[-.]?\d{4})/g;

  let match;
  while ((match = schoolPattern.exec(text2)) !== null) {
    const name = match[2].trim();
    const address = match[3].trim();
    const phone = match[4].trim();

    if (name.length > 3) {
      schools.push({
        name,
        licenseNumber: `RI-${match[1]}`,
        phone,
        address,
        website: "",
        onlineAvailable: false,
        notes: "",
      });
    }
  }
  return schools;
}

// ─── CONFIG ─────────────────────────────────────────────────

const sources: PdfSource[] = [
  {
    stateCode: "OK",
    stateName: "Oklahoma",
    sourceLabel: "OK DPS",
    url: "https://oklahoma.gov/content/dam/ok/en/dps/docs/driveredschools.pdf",
    parser: parseOklahoma,
  },
  {
    stateCode: "MN",
    stateName: "Minnesota",
    sourceLabel: "MN DPS",
    url: "https://assets.dps.mn.gov/files/dvs/dvs-accident-prevention-courses.pdf",
    parser: parseMinnesota,
  },
  {
    stateCode: "WY",
    stateName: "Wyoming",
    sourceLabel: "WY WDE",
    url: "https://edu.wyoming.gov/wp-content/uploads/2022/09/Driver-Education-Approved-Programs-Sheet1-1.pdf",
    parser: parseWyoming,
  },
  {
    stateCode: "RI",
    stateName: "Rhode Island",
    sourceLabel: "RI DMV",
    url: "https://dmv.ri.gov/media/2866/download?language=en",
    parser: parseRhodeIsland,
  },
];

// ─── MAIN ───────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2).map((a) => a.toUpperCase());
  const toRun = args.length > 0
    ? sources.filter((s) => args.includes(s.stateCode))
    : sources;

  console.log(`Processing ${toRun.length} PDF sources...\n`);

  for (const source of toRun) {
    console.log(`━━ ${source.stateName} (${source.stateCode}) ━━`);
    console.log(`  Downloading: ${source.url}`);

    try {
      const res = await fetch(source.url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; TrafficSchoolPicker/1.0)" },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        logIssue(`${source.stateName} PDF download failed (HTTP ${res.status})`, "DMV Scraper", "Warning", source.stateCode, source.url);
        console.log(`  FAILED: HTTP ${res.status}`);
        continue;
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      console.log(`  Downloaded: ${Math.round(buffer.length / 1024)}KB`);

      const data = await pdf(buffer);
      console.log(`  Parsed: ${data.numpages} pages, ${data.text.length} chars`);

      const schools = source.parser(data.text);
      console.log(`  Extracted: ${schools.length} schools`);

      if (schools.length === 0) {
        logIssue(`${source.stateName} PDF parser returned 0 results`, "DMV Scraper", "Warning", source.stateCode, "PDF format may have changed");
      } else {
        await syncToNotion(schools, source.stateName, source.sourceLabel, source.stateCode);
      }
    } catch (err) {
      logIssue(`${source.stateName} PDF scrape failed`, "DMV Scraper", "Critical", source.stateCode, (err as Error).message);
      console.error(`  ERROR: ${(err as Error).message}`);
    }

    console.log("");
  }

  await flushIssues();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
