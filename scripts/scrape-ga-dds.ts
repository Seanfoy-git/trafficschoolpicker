/**
 * Scrapes Georgia DDS Driver Improvement Clinics.
 * Selects "Driver Improvement Clinic" from dropdown, parses results from page text.
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { chromium } from "playwright";
import { ScrapedSchool, syncToNotion } from "./lib/scraper-utils";
import { logIssue, flushIssues } from "./lib/issues";

async function scrape(): Promise<ScrapedSchool[]> {
  console.log("Launching browser for GA DDS...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const schools: ScrapedSchool[] = [];

  try {
    await page.goto(
      "https://online.dds.ga.gov/ddsgeorgiagov/locations/driver-improvement-schools.aspx",
      { waitUntil: "networkidle", timeout: 30000 }
    );
    await page.waitForTimeout(2000);

    // Select "Driver Improvement Clinic"
    await page.selectOption("select", "DI");
    await page.waitForTimeout(1000);

    // Click search
    const btn = await page.$('button:has-text("Search"), a:has-text("Search")');
    if (btn) await btn.click();
    else await page.evaluate(() => {
      const b = document.querySelector('[onclick*="search"], .btn-primary') as HTMLElement;
      if (b) b.click();
    });
    await page.waitForTimeout(5000);

    // Parse from page text — records follow pattern:
    // DI######
    // SCHOOL NAME
    // ADDRESS
    // (PHONE)
    const text = await page.evaluate(() => document.body.innerText);
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    const certPattern = /^DI\d{6}$/;
    const phonePattern = /^\(\d{3}\)\s*\d{3}-\d{4}$/;

    for (let i = 0; i < lines.length; i++) {
      if (certPattern.test(lines[i])) {
        const certId = lines[i];
        const name = lines[i + 1]?.replace(/^[!0-9\s]+/, "").trim() ?? "";
        const address = lines[i + 2] ?? "";
        const phone = lines[i + 3] && phonePattern.test(lines[i + 3]) ? lines[i + 3] : "";

        if (name.length > 2) {
          schools.push({
            name,
            licenseNumber: certId,
            phone,
            address,
            website: "",
            onlineAvailable: true,
            notes: "Driver Improvement Clinic",
          });
        }
        i += 3; // Skip consumed lines
      }
    }
  } catch (err) {
    logIssue("GA DDS scrape failed", "DMV Scraper", "Critical", "GA", (err as Error).message);
  }

  await browser.close();
  console.log(`Scraped ${schools.length} GA driver improvement clinics`);
  return schools;
}

async function main() {
  console.log("Starting GA DDS scrape...");
  const schools = await scrape();
  if (schools.length === 0) {
    logIssue("GA DDS scrape returned 0 results", "DMV Scraper", "Critical", "GA", "No clinics found");
  }
  await syncToNotion(schools, "Georgia", "GA DDS", "GA");
  await flushIssues();
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
