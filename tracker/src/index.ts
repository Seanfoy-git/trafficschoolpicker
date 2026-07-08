/**
 * TrafficSchoolPicker click tracker — Cloudflare Worker on track.trafficschoolpicker.com
 *
 * Contract (verified against lib/affiliate.ts:buildDirectLink):
 *   GET /c/{partnerSlug}?s={STATE}&p={sourcePageId}
 *     - partnerSlug : URL PATH segment (e.g. "idrivesafely")
 *     - s           : 2-letter UPPERCASE state code (e.g. "NY") — the state key
 *     - p           : Notion source-page id (UUID) — logged for attribution, NOT the state
 *     - src         : reserved — paid-vs-organic flag (frontend does not send this yet)
 *
 * Behavior: log the click first (first-party record), then 302 to the mapped
 * network offer. Map lookup key is `${slug}:${STATE}`, with `${slug}:_default`
 * as the partner fallback. Never 404 — unmapped clicks still redirect and are
 * logged as misses so coverage gaps surface.
 *
 * Storage (Workers KV):
 *   MAP    — offer map. key `${slug}:${STATE}` or `${slug}:_default` → destination URL
 *   CLICKS — click log. key `click:{ISO}:{clickId}` → JSON record (TTL ~400d)
 */

export interface Env {
  MAP: KVNamespace;
  CLICKS: KVNamespace;
  SITE_URL: string;
}

const CLICK_TTL_SECONDS = 60 * 60 * 24 * 400; // ~400 days
const SITE_FALLBACK = "https://www.trafficschoolpicker.com";

const handler = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const site = env.SITE_URL || SITE_FALLBACK;

    // Only /c/{slug} is a tracked click. Anything else (root, favicon, probes)
    // goes to the site — never 404 a visitor.
    const match = url.pathname.match(/^\/c\/([^/]+)\/?$/);
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405, headers: { "Cache-Control": "no-store" } });
    }
    if (!match) {
      return redirect(site);
    }

    const slug = decodeURIComponent(match[1]).toLowerCase();
    const state = (url.searchParams.get("s") || "").trim().toUpperCase();
    const sourcePageId = (url.searchParams.get("p") || "").trim();
    const source = (url.searchParams.get("src") || "").trim(); // reserved: aff_sub2

    // Resolve destination: exact (slug:STATE) → partner default (slug:_default).
    const exact = state ? await env.MAP.get(`${slug}:${state}`) : null;
    const mapped = exact !== null; // true only when the exact state was mapped
    const dest = exact ?? (await env.MAP.get(`${slug}:_default`));
    const fellBackToSite = dest === null; // no mapping at all for this partner
    const destination = dest || site;

    // Attach HasOffers subids for network-side reporting + first-party reconciliation.
    // When we fell all the way back to our own site (no offer at all), redirect
    // bare — subids only make sense on a network destination.
    const clickId = crypto.randomUUID();
    const finalUrl = fellBackToSite ? destination : decorate(destination, { state, source, clickId });

    // Log FIRST, then redirect. Unique key per click avoids KV single-key contention.
    const nowIso = new Date().toISOString();
    const record = {
      clickId,
      ts: nowIso,
      slug,
      state: state || null,
      sourcePageId: sourcePageId || null,
      source: source || null,
      destination: finalUrl,
      mapped,          // false → used partner default (state coverage gap)
      fellBackToSite,  // true  → no partner mapping at all
      referrer: request.headers.get("referer"),
      ua: request.headers.get("user-agent"),
      country: (request.cf && (request.cf as { country?: string }).country) || null,
    };
    await env.CLICKS.put(`click:${nowIso}:${clickId}`, JSON.stringify(record), {
      expirationTtl: CLICK_TTL_SECONDS,
      metadata: { slug, state: state || "", mapped, fellBackToSite },
    });

    return redirect(finalUrl);
  },
};

export default handler;

/** Append reporting subids without clobbering the offer's own query (offer_id, aff_id, …). */
function decorate(
  destination: string,
  { state, source, clickId }: { state: string; source: string; clickId: string }
): string {
  try {
    const d = new URL(destination);
    if (state) d.searchParams.set("aff_sub", `tsp-${state}`);
    if (source) d.searchParams.set("aff_sub2", source); // reserved paid/organic flag
    d.searchParams.set("aff_sub3", clickId);             // ties network conversions → our click log
    return d.toString();
  } catch {
    return destination; // malformed mapped URL — redirect as-is rather than fail the click
  }
}

function redirect(location: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      "Cache-Control": "no-store", // every hit must reach the Worker so every click logs
      "Referrer-Policy": "no-referrer-when-downgrade",
    },
  });
}
