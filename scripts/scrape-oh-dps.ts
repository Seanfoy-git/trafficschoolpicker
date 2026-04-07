/**
 * Scrapes Ohio DPS Adult Remedial Online courses.
 * Selects "Adult Remedial Online" from dropdown, parses result table.
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { chromium } from "playwright";
import { ScrapedSchool, syncToNotion } from "./lib/scraper-utils";
import { logIssue, flushIssues } from "./lib/issues";

async function scrape(): Promise<ScrapedSchool[]> {
  console.log("Launching browser for OH DPS...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const schools: ScrapedSchool[] = [];

  try {
    await page.goto("https://apps.dps.ohio.gov/DETS/public/schools", {
      waitUntil: "networkidle", timeout: 30000,
    });
    await page.waitForTimeout(2000);

    // Select "Adult Remedial Online"
    await page.selectOption("#Parameters_SchoolType", "Adult Remedial Online");
    await page.waitForTimeout(500);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    // Parse table rows
    const rows = await page.$$eval("table tbody tr", (trs) =>
      trs.map((tr) => {
        const cells = Array.from(tr.querySelectorAll("td")).map((td) => td.textContent?.trim() ?? "");
        const link = tr.querySelector('a[href*="http"]')?.getAttribute("href") ?? "";
        return { cells, link };
      })
    );

    for (const row of rows) {
      if (row.cells.length >= 3 && row.cells[0].length > 2) {
        schools.push({
          name: row.cells[0].replace(/^!!?\s*"?|"?\s*!!?$/g, "").trim(),
          licenseNumber: "OH-ARO",
          phone: row.cells[1],
          address: "",
          website: row.link,
          onlineAvailable: true,
          notes: `Language: ${row.cells[2] ?? "English"}`,
        });
      }
    }

    // Also scrape "Abbreviated Adult Online Courses"
    await page.selectOption("#Parameters_SchoolType", "Abbreviated Adult Online Courses");
    await page.waitForTimeout(500);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    const rows2 = await page.$$eval("table tbody tr", (trs) =>
      trs.map((tr) => {
        const cells = Array.from(tr.querySelectorAll("td")).map((td) => td.textContent?.trim() ?? "");
        const link = tr.querySelector('a[href*="http"]')?.getAttribute("href") ?? "";
        return { cells, link };
      })
    );

    for (const row of rows2) {
      if (row.cells.length >= 3 && row.cells[0].length > 2) {
        const name = row.cells[0].replace(/^!!?\s*"?|"?\s*!!?$/g, "").trim();
        if (!schools.find((s) => s.name === name)) {
          schools.push({
            name,
            licenseNumber: "OH-AAO",
            phone: row.cells[1],
            address: "",
            website: row.link,
            onlineAvailable: true,
            notes: `Abbreviated Adult. Language: ${row.cells[2] ?? "English"}`,
          });
        }
      }
    }
  } catch (err) {
    logIssue("OH DPS scrape failed", "DMV Scraper", "Critical", "OH", (err as Error).message);
  }

  await browser.close();
  console.log(`Scraped ${schools.length} OH online courses`);
  return schools;
}

async function main() {
  console.log("Starting OH DPS scrape...");
  const schools = await scrape();
  if (schools.length === 0) {
    logIssue("OH DPS scrape returned 0 results", "DMV Scraper", "Critical", "OH", "No schools found");
  }
  await syncToNotion(schools, "Ohio", "OH DPS", "OH");
  await flushIssues();
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
