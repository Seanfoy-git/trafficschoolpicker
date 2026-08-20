/**
 * JSON-LD price source — for schools that publish per-state Product/Course/Offer
 * structured data in their (server-rendered) HTML. Read with plain fetch, no
 * browser. Used for the schools NOT on the xgrit backend (e.g. Improv).
 *
 * URLs come from the school's sitemap, filtered to canonical per-STATE landing
 * pages (path segment === a real US state name) so blog/city/county pages don't
 * leak in.
 */
import { STATE_LIST } from "../../lib/state-utils";

const UA = { "User-Agent": "Mozilla/5.0 (compatible; trafficschoolpicker/1.0)" };
const kebab = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
const STATE_BY_SLUG = new Map(STATE_LIST.map((s) => [kebab(s.name), s.code] as const));

async function text(url: string): Promise<string> {
  const r = await fetch(url, { headers: UA });
  return r.ok ? r.text() : "";
}

// Resolve one canonical landing page per state from a school's sitemap(s).
// pathRe must capture the state-name segment in group 1.
export async function resolveSitemapStateUrls(sitemaps: string[], pathRe: RegExp): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (const sm of sitemaps) {
    const xml = await text(sm);
    for (const m of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) {
      const url = m[1];
      const pm = url.match(pathRe);
      if (!pm) continue;
      const code = STATE_BY_SLUG.get(pm[1]);
      if (code && !out.has(code)) out.set(code, url);
    }
  }
  return out;
}

// Every numeric "price" in the page's JSON-LD blocks (deduped, ascending).
export async function jsonLdPrices(url: string): Promise<number[]> {
  const html = await text(url);
  const prices = new Set<number>();
  for (const m of html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    for (const pm of m[1].matchAll(/"price"\s*:\s*"?(\d+(?:\.\d+)?)/gi)) {
      const v = Number(pm[1]);
      if (Number.isFinite(v) && v > 0) prices.add(v);
    }
  }
  return [...prices].sort((a, b) => a - b);
}
