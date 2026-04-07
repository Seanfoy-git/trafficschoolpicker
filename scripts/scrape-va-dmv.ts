/**
 * Scrapes Virginia DMV Driver Improvement Online Clinics.
 * Drupal 10 faceted search. Filter by "Online Clinic", paginate through all 20 pages.
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { chromium } from "playwright";
import { ScrapedSchool, syncToNotion } from "./lib/scraper-utils";
import { logIssue, flushIssues } from "./lib/issues";

async function scrape(): Promise<ScrapedSchool[]> {
  console.log("Launching browser for VA DMV...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const schools: ScrapedSchool[] = [];

  try {
    // Start with Online Clinic filter
    let url = "https://www.dmv.virginia.gov/licenses-ids/improvement/clinics-schools?f[0]=clinic_type:316";
    let pageNum = 1;

    while (url) {
      console.log(`  Page ${pageNum}...`);
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(2000);

      // Extract cards from div.c-list-card
      const cards = await page.$$eval(".c-list-card, .views-row", (els) =>
        els.map((el) => {
          const name = el.querySelector("h3 span, .c-list-card__title span, h3")?.textContent?.trim() ?? "";
          const phone = el.querySelector(".c-list-card__telephone a, a[href^='tel:']")?.textContent?.trim() ?? "";
          const website = el.querySelector(".c-list-card__website a, a[href^='http']:not([href*='dmv.virginia'])")?.getAttribute("href") ?? "";
          const type = el.querySelector(".c-pill, .field--name-field-clinic-type")?.textContent?.trim() ?? "";
          return { name, phone, website, type };
        })
      );

      for (const card of cards) {
        if (card.name.length > 2) {
          schools.push({
            name: card.name,
            licenseNumber: "VA-DIC",
            phone: card.phone,
            address: "",
            website: card.website,
            onlineAvailable: true,
            notes: card.type || "Online Clinic",
          });
        }
      }

      // Find next page link
      const nextLink = await page.$eval(
        "a.c-pager__link--next, a[rel='next'], .pager__item--next a",
        (a) => a.getAttribute("href"),
      ).catch(() => null);

      if (nextLink && cards.length > 0) {
        url = nextLink.startsWith("http") ? nextLink : `https://www.dmv.virginia.gov${nextLink}`;
        pageNum++;
        await new Promise((r) => setTimeout(r, 1000));
      } else {
        url = "";
      }
    }
  } catch (err) {
    logIssue("VA DMV scrape failed", "DMV Scraper", "Critical", "VA", (err as Error).message);
  }

  await browser.close();
  console.log(`Scraped ${schools.length} VA online clinics`);
  return schools;
}

async function main() {
  console.log("Starting VA DMV scrape...");
  const schools = await scrape();
  if (schools.length === 0) {
    logIssue("VA DMV scrape returned 0 results", "DMV Scraper", "Critical", "VA", "No clinics found");
  }
  await syncToNotion(schools, "Virginia", "VA DMV", "VA");
  await flushIssues();
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
