/**
 * Florida FLHSMV approved BDI course providers, read from the page's provider
 * table in the DOM (P0 follow-up, round 5): the table whose header cells are
 * NAME, DELIVERY METHOD and CONTACT INFORMATION; one school per body row;
 * header rows skipped; nothing outside the table. The old line-by-line read of
 * document.body.innerText stopped only at "PRIVACY STATEMENT", so headings,
 * the table header and the FAQ came through as schools, and some names got
 * the delivery method glued on.
 */
import { chromium, type Page } from "playwright";

export const BDI_URL =
  "https://www.flhsmv.gov/driver-licenses-id-cards/education-courses/driver-improvement-schools/basic-driver-improvement-bdi-find-approved-listing-bdi-course-providers/";

export interface FLProvider {
  /** The full NAME cell, county note included: the stored convention for the older rows, so they still match. */
  name: string;
  /** The parenthetical from the NAME cell, e.g. "Broward County Citations Only" (written to Notes, as before). */
  notes: string;
  deliveryMethod: string;
  phone: string;
  website: string;
  /** Online Available: the delivery method includes Internet or App. */
  online: boolean;
}

const squash = (s: string) => s.replace(/\s+/g, " ").trim();

export function onlineFromDelivery(delivery: string): boolean {
  const d = delivery.toLowerCase();
  return d.includes("internet") || /\bapp\b/.test(d);
}

export async function parseFLProviders(page: Page): Promise<FLProvider[]> {
  const rows = await page.$$eval("table", (tables) => {
    const want = ["NAME", "DELIVERY METHOD", "CONTACT INFORMATION"];
    const table = tables.find((t) => {
      const heads = Array.from(t.querySelectorAll("th")).map((th) => (th.textContent ?? "").replace(/\s+/g, " ").trim().toUpperCase());
      return want.every((w) => heads.includes(w));
    });
    if (!table) return null;
    return Array.from(table.querySelectorAll("tr"))
      .filter((tr) => tr.querySelectorAll("td").length >= 3) // header rows are <th>
      .map((tr) => {
        const td = tr.querySelectorAll("td");
        const link = td[2].querySelector("a[href^='http']") as HTMLAnchorElement | null;
        return { name: (td[0] as HTMLElement).innerText, delivery: (td[1] as HTMLElement).innerText, contact: (td[2] as HTMLElement).innerText, website: link?.href ?? "" };
      });
  });
  if (!rows) throw new Error("FLHSMV provider table not found (no table with NAME / DELIVERY METHOD / CONTACT INFORMATION headers)");
  return rows
    .map((r) => {
      const deliveryMethod = r.delivery.split(/\n+/).map(squash).filter(Boolean).join(", ");
      // County restrictions etc. sit in parentheses in the NAME cell (one on the page lacks its ")").
      const full = squash(r.name);
      const notes = [...full.matchAll(/\(([^)]*)\)?/g)].map((m) => squash(m[1])).filter(Boolean).join("; ");
      return {
        name: full,
        notes,
        deliveryMethod,
        phone: r.contact.match(/\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}/)?.[0] ?? "",
        website: r.website,
        online: onlineFromDelivery(deliveryMethod),
      };
    })
    .filter((r) => r.name);
}

/** Launch a browser, read the live page, parse. No writes. */
export async function scrapeFLProviders(): Promise<FLProvider[]> {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(BDI_URL, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(2000);
    return await parseFLProviders(page);
  } finally {
    await browser.close();
  }
}
