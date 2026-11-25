/**
 * Scrapes Virginia DMV Driver Improvement Online Clinics.
 *
 * Source: the DMV's Drupal faceted list, filtered to "Online Clinic"
 * (clinic_type:316), ten cards a page.
 *
 * Two traps found 25 Nov 2026, when Virginia's directory had not been written
 * since 1 May:
 *  1. The pager now emits a bare query ("?f[0]=…&pg=2"). The old scraper glued
 *     it onto the domain without the path, so page 2 loaded the DMV homepage,
 *     found no cards and stopped at 10 clinics.
 *  2. The list is served in a different random order on every render, so one
 *     pass over the 23 pages repeats some clinics and misses about a third
 *     (each pass sees ~160 distinct of 229). We page through repeatedly, with a
 *     cache-busting parameter so each pass gets a fresh order, and keep the
 *     union until a full pass adds nothing new twice running.
 * The page is server-rendered, so plain fetch replaces the browser.
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { ScrapedSchool, syncToNotion } from "./lib/scraper-utils";
import { logIssue, flushIssues } from "./lib/issues";

const BASE = "https://www.dmv.virginia.gov/licenses-ids/improvement/clinics-schools?f%5B0%5D=clinic_type%3A316";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
const MAX_PASSES = 10;
const MAX_PAGES = 60;

function decode(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&#0?39;|&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchPage(pg: number, pass: number): Promise<string> {
  const url = `${BASE}${pg > 1 ? `&pg=${pg}` : ""}&cb=${Date.now()}-${pass}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(30000) });
      if (res.ok) return await res.text();
    } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 1500 * attempt));
  }
  return "";
}

/** Cards on one page: name, phone, website, type pill. */
function parseCards(html: string): ScrapedSchool[] {
  const out: ScrapedSchool[] = [];
  const blocks = html.split('class="c-list-card"').slice(1);
  for (const b of blocks) {
    const name = decode(b.match(/c-list-card__title[^>]*>([\s\S]*?)<\/h3>/)?.[1] ?? "");
    if (name.length <= 2) continue;
    const phone = decode(b.match(/c-list-card__telephone[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/)?.[1] ?? "");
    const website = b.match(/c-list-card__website[\s\S]*?<a[^>]*href="([^"]+)"/)?.[1] ?? "";
    const type = decode(b.match(/class="c-pill"[^>]*>([\s\S]*?)<\/span>/)?.[1] ?? "");
    out.push({
      name,
      licenseNumber: "", // the VA DMV list publishes no licence number; never a placeholder
      phone,
      address: "",
      website: website.replace(/&amp;/g, "&"),
      onlineAvailable: true,
      notes: type || "Online Clinic",
    });
  }
  return out;
}

function lastPage(html: string): number {
  const pages = [...html.matchAll(/[?&](?:amp;)?pg=(\d+)/g)].map((m) => Number(m[1]));
  return Math.min(MAX_PAGES, pages.length ? Math.max(...pages) : 1);
}

async function scrape(): Promise<ScrapedSchool[]> {
  const union = new Map<string, ScrapedSchool>(); // keyed by name + website
  let quietPasses = 0;
  let slots = 0;
  for (let pass = 1; pass <= MAX_PASSES && quietPasses < 2; pass++) {
    const first = await fetchPage(1, pass);
    const pages = lastPage(first);
    const before = union.size;
    slots = 0;
    for (let pg = 1; pg <= pages; pg++) {
      const html = pg === 1 ? first : await fetchPage(pg, pass);
      const cards = parseCards(html);
      slots += cards.length;
      for (const c of cards) union.set(`${c.name.toLowerCase()}|${c.website.toLowerCase()}`, c);
      await new Promise((r) => setTimeout(r, 400));
    }
    const added = union.size - before;
    console.log(`  pass ${pass}: ${pages} pages, ${slots} cards, ${union.size} distinct (+${added})`);
    quietPasses = added === 0 ? quietPasses + 1 : 0;
    // Every card slot accounted for: the list is complete.
    if (union.size >= slots && slots > 0 && pass > 1) break;
  }
  if (union.size < slots) {
    logIssue(
      "VA DMV scrape may be incomplete",
      "DMV Scraper", "Warning", "VA",
      `${union.size} distinct clinics after ${MAX_PASSES} passes against ${slots} card slots per pass.`,
    );
  }
  console.log(`Scraped ${union.size} VA online clinics`);
  return [...union.values()];
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
