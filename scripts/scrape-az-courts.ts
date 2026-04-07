/**
 * Scrapes Arizona Supreme Court approved defensive driving schools.
 * The school dropdown on the Class Results page contains all 239 schools
 * as option elements — no search interaction needed.
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { chromium } from "playwright";
import { ScrapedSchool, syncToNotion } from "./lib/scraper-utils";
import { logIssue, flushIssues } from "./lib/issues";

const URL = "https://www.azcourts.gov/drive/Class-Results";

async function scrape(): Promise<ScrapedSchool[]> {
  console.log("Launching browser for AZ Courts...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const schools: ScrapedSchool[] = [];

  try {
    await page.goto(URL, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);

    // The school select dropdown contains all approved schools
    // Selector: #dnn_ctr7434_XModPro_ctl00_ctl00_ctl00_schoolCode or select with school options
    const options = await page.$$eval("select option", (opts) =>
      opts.map((o) => ({
        value: o.value,
        text: o.textContent?.trim() ?? "",
      })).filter((o) => o.value && o.text && o.text !== "Select" && o.text.length > 2)
    );

    // Filter to school-like entries (the dropdown might have multiple selects)
    // School codes typically look like alphanumeric IDs
    for (const opt of options) {
      // Skip distance/language/time options
      if (opt.text.match(/^\d+\s*(miles?|am|pm)$/i)) continue;
      if (opt.text.match(/^(English|Spanish|Select|Any|AM|PM)$/i)) continue;
      if (opt.text.match(/^\d{5}$/)) continue; // zip codes

      // School names are typically longer and have proper names
      if (opt.text.length > 5 && !opt.text.match(/^\d+$/)) {
        schools.push({
          name: opt.text,
          licenseNumber: opt.value || "AZ-DDS",
          phone: "",
          address: "",
          website: "",
          onlineAvailable: true,
          notes: "AZ Supreme Court approved defensive driving school",
        });
      }
    }
  } catch (err) {
    logIssue("AZ Courts scrape failed", "DMV Scraper", "Critical", "AZ", (err as Error).message);
  }

  await browser.close();
  console.log(`Scraped ${schools.length} AZ defensive driving schools from dropdown`);
  return schools;
}

async function main() {
  console.log("Starting AZ Courts scrape...");
  const schools = await scrape();
  if (schools.length === 0) {
    logIssue("AZ Courts scrape returned 0 results", "DMV Scraper", "Critical", "AZ", `URL: ${URL}`);
  }
  await syncToNotion(schools, "Arizona", "AZ Courts", "AZ");
  await flushIssues();
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
