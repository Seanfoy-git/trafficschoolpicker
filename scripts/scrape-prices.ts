/**
 * Visits each Tier 1 school's pricing page, extracts the current price,
 * and writes data/tier1-prices.json. Falls back to stored price if
 * scraping fails.
 */

import { writeFileSync, mkdirSync } from "fs";
import * as path from "path";
import * as cheerio from "cheerio";

type PriceResult = {
  school: string;
  slug: string;
  url: string;
  price: number | null;
  previousPrice: number | null;
  scrapedAt: string;
  error: string | null;
};

// Tier 1 schools and the pages/selectors where their traffic school price appears
const SCHOOLS = [
  {
    name: "iDriveSafely",
    slug: "idrivesafely",
    url: "https://www.idrivesafely.com/traffic-school/",
    // Price usually appears in a prominent element with dollar sign
    selectors: [
      '[class*="price"]',
      '[class*="Price"]',
      '[data-price]',
      ".cost",
      ".amount",
    ],
    fallbackPattern: /\$(\d+(?:\.\d{2})?)/,
  },
  {
    name: "Aceable",
    slug: "aceable",
    url: "https://www.aceable.com/defensive-driving/",
    selectors: [
      '[class*="price"]',
      '[class*="Price"]',
      '[data-price]',
      ".cost",
      ".amount",
    ],
    fallbackPattern: /\$(\d+(?:\.\d{2})?)/,
  },
  {
    name: "TicketSchool",
    slug: "ticketschool",
    url: "https://www.ticketschool.com/",
    selectors: [
      '[class*="price"]',
      '[class*="Price"]',
      '[data-price]',
      ".cost",
      ".amount",
    ],
    fallbackPattern: /\$(\d+(?:\.\d{2})?)/,
  },
  {
    name: "Improv Traffic School",
    slug: "improv-traffic-school",
    url: "https://www.improvtrafficschool.com/",
    selectors: [
      '[class*="price"]',
      '[class*="Price"]',
      '[data-price]',
      ".cost",
      ".amount",
    ],
    fallbackPattern: /\$(\d+(?:\.\d{2})?)/,
  },
  {
    name: "DriversEd.com",
    slug: "driversed",
    url: "https://www.driversed.com/traffic-school/",
    selectors: [
      '[class*="price"]',
      '[class*="Price"]',
      '[data-price]',
      ".cost",
      ".amount",
    ],
    fallbackPattern: /\$(\d+(?:\.\d{2})?)/,
  },
];

/** Try to extract a price from HTML using CSS selectors, then regex fallback. */
function extractPrice(
  html: string,
  selectors: string[],
  fallbackPattern: RegExp
): number | null {
  const $ = cheerio.load(html);

  // Try each selector
  for (const sel of selectors) {
    const els = $(sel);
    for (let i = 0; i < els.length; i++) {
      const text = els.eq(i).text();
      const match = text.match(/\$(\d+(?:\.\d{2})?)/);
      if (match) {
        const price = parseFloat(match[1]);
        // Sanity check — traffic school prices are typically $10–$100
        if (price >= 5 && price <= 150) return price;
      }
      // Check data-price attribute
      const dataPrice = els.eq(i).attr("data-price");
      if (dataPrice) {
        const price = parseFloat(dataPrice);
        if (price >= 5 && price <= 150) return price;
      }
    }
  }

  // Regex fallback — find all dollar amounts and pick the most common reasonable one
  const allPrices: number[] = [];
  let m: RegExpExecArray | null;
  const priceRegex = /\$(\d+(?:\.\d{2})?)/g;
  while ((m = priceRegex.exec(html)) !== null) {
    const p = parseFloat(m[1]);
    if (p >= 10 && p <= 100) allPrices.push(p);
  }

  if (allPrices.length > 0) {
    // Return the most common price (mode)
    const freq: Record<number, number> = {};
    for (const p of allPrices) freq[p] = (freq[p] ?? 0) + 1;
    const sorted = Object.entries(freq).sort(
      (a, b) => Number(b[1]) - Number(a[1])
    );
    return parseFloat(sorted[0][0]);
  }

  return null;
}

async function main() {
  console.log("Scraping Tier 1 school prices...\n");

  // Load previous prices if available
  const prevPricesPath = path.join(process.cwd(), "data", "tier1-prices.json");
  let prevPrices: Record<string, number> = {};
  try {
    const raw = await import("fs").then((fs) =>
      fs.readFileSync(prevPricesPath, "utf-8")
    );
    const prev: PriceResult[] = JSON.parse(raw);
    for (const p of prev) {
      if (p.price !== null) prevPrices[p.slug] = p.price;
    }
  } catch {
    // No previous data
  }

  const results: PriceResult[] = [];

  for (const school of SCHOOLS) {
    process.stdout.write(`  ${school.name}... `);
    let price: number | null = null;
    let error: string | null = null;

    try {
      const res = await fetch(school.url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        error = `HTTP ${res.status}`;
      } else {
        const html = await res.text();
        price = extractPrice(html, school.selectors, school.fallbackPattern);
        if (price === null) {
          error = "Could not extract price from page";
        }
      }
    } catch (err) {
      error = (err as Error).message;
    }

    const previousPrice = prevPrices[school.slug] ?? null;
    results.push({
      school: school.name,
      slug: school.slug,
      url: school.url,
      price,
      previousPrice,
      scrapedAt: new Date().toISOString(),
      error,
    });

    if (price !== null) {
      const changed =
        previousPrice !== null && previousPrice !== price
          ? ` (was $${previousPrice.toFixed(2)})`
          : "";
      console.log(`$${price.toFixed(2)}${changed}`);
    } else {
      console.log(`FAILED: ${error}`);
    }

    // Polite delay
    await new Promise((r) => setTimeout(r, 2000));
  }

  const outDir = path.join(process.cwd(), "data");
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "tier1-prices.json");
  writeFileSync(outPath, JSON.stringify(results, null, 2));

  const succeeded = results.filter((r) => r.price !== null).length;
  console.log(
    `\nDone. ${succeeded}/${results.length} prices scraped → ${outPath}`
  );
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
