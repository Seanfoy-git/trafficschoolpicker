/**
 * Scraper Rules DB — the WS2 course-type-gated source of truth for what the
 * price scraper targets. One hand-curated row per school × state × course-type:
 * exact Target URL, Course Type + Variant (to disambiguate the many prices a
 * page shows — drivers-ed vs BDI, standard vs handsfree/combo, sale vs reg), a
 * Verified Price anchor, a per-rule Expected Min/Max band, and an Extract Hint.
 *
 * The scraper reads Status = "Verified" rows from here instead of the static
 * price-sources.ts list. price-sources.ts remains a typed FALLBACK so a Notion
 * outage during the monthly cron can't leave the scraper with zero targets.
 */
import type { Client } from "@notionhq/client";

export interface ScraperRule {
  pageId: string;
  ruleName: string;
  schoolSlug: string; // matches the Pricing-DB label slug / partner slug (e.g. "aceable")
  state: string; // 2-letter UPPERCASE
  courseType: string; // Defensive Driving | Drivers Ed | BDI | ADI | 8-Hour Traffic School | …
  variant: string; // Standard | Handsfree-Audio | Combo | Premium | Other
  url: string; // exact course page
  priceBasis: string; // "Reg Price" | "Sale Price"
  verifiedPrice: number | null; // hand-checked anchor
  expectedMin: number | null; // per-rule sanity band
  expectedMax: number | null;
  extractHint: string; // human guidance surfaced on quarantine
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const rt = (p: any) => p?.rich_text?.map((t: any) => t.plain_text).join("") ?? "";
const title = (p: any) => p?.title?.map((t: any) => t.plain_text).join("") ?? "";
const sel = (p: any) => p?.select?.name ?? "";
const num = (p: any) => (typeof p?.number === "number" ? p.number : null);

function mapRule(row: any): ScraperRule {
  const p = row.properties;
  return {
    pageId: row.id,
    ruleName: title(p["Rule Name"]),
    schoolSlug: rt(p["School Slug"]).trim().toLowerCase(),
    state: rt(p["State Code"]).trim().toUpperCase(),
    courseType: sel(p["Course Type"]),
    variant: sel(p["Variant"]),
    url: p["Target URL"]?.url ?? "",
    priceBasis: sel(p["Price Basis"]),
    verifiedPrice: num(p["Verified Price"]),
    expectedMin: num(p["Expected Min"]),
    expectedMax: num(p["Expected Max"]),
    extractHint: rt(p["Extract Hint"]),
  };
}

/**
 * Fetch every Status = "Verified" rule. Returns [] if the DB is unset or the
 * query fails (caller falls back to price-sources.ts). A rule missing a slug,
 * state, or URL is dropped as unusable.
 */
export async function fetchVerifiedRules(notion: Client): Promise<ScraperRule[]> {
  // Read at call time, not module load — the entry script runs dotenv config()
  // after ESM imports are already evaluated, so a module-level capture is undefined.
  const RULES_DB = process.env.NOTION_SCRAPER_RULES_DB;
  if (!RULES_DB) return [];
  try {
    const out: ScraperRule[] = [];
    let cursor: string | undefined;
    do {
      const r: any = await notion.databases.query({
        database_id: RULES_DB,
        filter: { property: "Status", select: { equals: "Verified" } },
        start_cursor: cursor,
        page_size: 100,
      });
      out.push(...r.results.map(mapRule));
      cursor = r.has_more ? r.next_cursor : undefined;
    } while (cursor);
    return out.filter((r) => r.schoolSlug && r.state && r.url);
  } catch (err) {
    console.warn(`[scraper-rules] fetch failed (${(err as Error).message}) — caller should fall back`);
    return [];
  }
}
