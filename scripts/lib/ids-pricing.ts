/**
 * xgrit-FAMILY price source — the authoritative, re-runnable way to get per-state
 * prices for the Aceable-owned brands (I Drive Safely, Aceable, DriversEd), which
 * all render prices from the same xgrit backend and share one Tune account.
 *
 * WHY THIS EXISTS: these sites render prices CLIENT-SIDE from their pricing API, so
 * the static HTML only carries the struck REGULAR (scraping it overpriced every
 * state). Instead we call the same endpoints the page calls and read the advertised
 * numbers directly. Cross-validated against 5 JSON-LD states + 11 human-verified
 * currents/regulars (IDS + Aceable).
 *
 * Response shapes (current = the SHOWN price):
 *   get-multiple-products      -> productsData{ k:{grossTotal,total} }  cur=total, reg=grossTotal
 *   get-price-and-checkout-url }
 *   purchase-receipt/price     } lineItemList[]{ chargeAmount, couponList[], product._id }
 *   purchase-receipt/multiprice}   cur = chargeAmount;  reg = chargeAmount + hidden discount
 *                                  (the hidden coupon is the regular->current gap, e.g.
 *                                   Aceable CA 29+20=49, FL 5.94+29.01=34.95, IDS IN 49+10=59).
 */
import { chromium, type Page } from "playwright";
import { STATE_LIST } from "../../lib/state-utils";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function tune(t: string, m: string, p: Array<[string, string]>) {
  const NET = process.env.TUNE_NETWORK_ID!, KEY = process.env.TUNE_API_KEY!; // read lazily (after dotenv)
  const u = new URL(`https://${NET}.api.hasoffers.com/Apiv3/json`);
  u.searchParams.set("NetworkId", NET); u.searchParams.set("api_key", KEY);
  u.searchParams.set("Target", t); u.searchParams.set("Method", m);
  for (const [k, v] of p) u.searchParams.append(k, v);
  const j: any = await (await fetch(u)).json();
  if (j?.response?.status !== 1) throw new Error(JSON.stringify(j?.response?.errors ?? j).slice(0, 200));
  return j.response.data;
}

const STATES = [...STATE_LIST].sort((a, b) => b.name.length - a.name.length);
export function stateOf(name: string): string | null {
  const n = name.toLowerCase();
  if (/washington,?\s*d\.?c\.?|district of columbia/.test(n)) return "DC";
  for (const s of STATES) if (s.code !== "DC" && n.includes(s.name.toLowerCase())) return s.code;
  return null;
}
const KEEP = /defensive driving|traffic school|driver improvement|reduction|\bpirp\b|\bbdi\b|\badi\b|ticket/i;
const EXCLUDE = /homepage|homeschool|drivers? ?ed|driver'?s ed|\bteen\b|adult drivers|pre-licens|instructor led|\bmature\b|aarp|permit|packet|real estate|mortgage|all vertical|abbreviated/i;

// The xgrit family — all on the same pricing backend + the same Tune account.
export const BRANDS: Record<string, RegExp> = {
  idrivesafely: /i drive safely/i,
  aceable: /\baceable\b/i, // NB: exclude AceableAgent (real-estate) via EXCLUDE below
  driversed: /drivers ?ed|driver'?s ed/i,
};

// Resolve one traffic-school preview_url per state for a brand from the live Tune
// catalogue. NOTE: for driversed the KEEP/EXCLUDE gate below may return nothing —
// its Tune offers are drivers-ed, not traffic school (handled by the caller).
export async function resolveBrandTargets(brand: keyof typeof BRANDS | string): Promise<Map<string, string>> {
  const brandRe = BRANDS[brand] ?? new RegExp(`\\b${brand}\\b`, "i");
  const all: any[] = [];
  let page = 1;
  for (;;) {
    const d = await tune("Affiliate_Offer", "findAll", [["fields[]","id"],["fields[]","name"],["fields[]","preview_url"],["fields[]","status"],["limit","1000"],["page",String(page)]]);
    for (const r of Object.values(d.data) as any[]) all.push(r.Offer ?? r);
    if (page >= (Number(d.pageCount) || 1)) break; page++;
  }
  const targets = new Map<string, string>();
  for (const o of all) {
    if (o.status !== "active" || !brandRe.test(o.name) || /aceableagent/i.test(o.name) || EXCLUDE.test(o.name) || !KEEP.test(o.name)) continue;
    const code = stateOf(o.name);
    if (code && o.preview_url && !targets.has(code)) targets.set(code, o.preview_url);
  }
  return targets;
}

// Back-compat alias (the shipped IDS sync/discovery import this name).
export const resolveIdsTargets = () => resolveBrandTargets("idrivesafely");

export type Product = { current: number; regular: number; course?: string; coupon?: string };

// A lineItemList entry (shared by IDS get-price-and-checkout-url + the shared
// backend's purchase-receipt/price + multiprice). current = chargeAmount (the
// couponList is a HIDDEN checkout-only discount — do NOT subtract it); course =
// product._id (stable pin id).
function fromLineItem(li: any): Product | null {
  const charge = Number(li?.chargeAmount);
  if (!Number.isFinite(charge) || charge <= 0) return null;
  // current = chargeAmount (the shown price). regular (struck) = current + the
  // auto-applied hidden discount that produced it (validated: Aceable CA 29+20=49,
  // FL 5.94+29.01=34.95; IDS IN 49+10=59). Fall back to a higher listed modifier.
  const disc = (li?.couponList ?? []).reduce((s: number, c: any) => s + (Number(c?.discountAmount) || 0), 0);
  const modifier = Number(li?.hiddenModifierPrice ?? li?.listPrice);
  const regular = Math.max(charge + disc, Number.isFinite(modifier) ? modifier : 0);
  return { current: charge, regular: regular > charge ? regular : charge, course: li?.product?._id, coupon: li?.couponList?.[0]?.code };
}

export function productsFromXgrit(url: string, body: any): Product[] {
  const out: Product[] = [];
  const cp = (u?: string) => (String(u).match(/coupon=([^&]+)/) || [])[1];
  const cid = (u?: string) => (String(u).match(/courseId=([^&]+)/) || [])[1];
  // IDS storefront: productsData map (total = current, grossTotal = regular).
  if (/get-multiple-produc/.test(url) && body?.productsData) {
    for (const p of Object.values(body.productsData) as any[]) {
      const current = Number(p.total), regular = Number(p.grossTotal);
      if (Number.isFinite(current) && current > 0) out.push({ current, regular: Number.isFinite(regular) ? regular : current, course: cid(p.checkoutUrl), coupon: cp(p.checkoutUrl) });
    }
  }
  // IDS single-product endpoint: price.lineItemList.
  if (/get-price-and-checkout-url|get-multiple-prices/.test(url)) {
    for (const li of (body?.price?.lineItemList ?? body?.lineItemList ?? []) as any[]) {
      const p = fromLineItem(li);
      if (p) { p.course ??= cid(body?.price?.checkoutUrl); p.coupon ??= cp(body?.price?.checkoutUrl); out.push(p); }
    }
  }
  // Shared xgrit backend (Aceable / DriversEd): purchase-receipt/price (top-level
  // lineItemList) and /multiprice (priceSetList[].lineItemList).
  if (/purchase-receipt\/price/.test(url)) {
    for (const li of (body?.lineItemList ?? []) as any[]) { const p = fromLineItem(li); if (p) out.push(p); }
  }
  if (/purchase-receipt\/multiprice/.test(url)) {
    for (const set of (body?.priceSetList ?? []) as any[])
      for (const li of (set?.lineItemList ?? []) as any[]) { const p = fromLineItem(li); if (p) out.push(p); }
  }
  return out;
}

const XGRIT_ENDPOINT = /\/api\/xgrit\/(get-multiple-produc|get-multiple-prices|get-price-and-checkout-url)|purchase-receipt\/(price|multiprice)/;

// Load a landing page and capture the price(s) it fetches from the xgrit API.
export async function fetchStatePrices(pg: Page, url: string): Promise<Product[]> {
  const products: Product[] = [];
  const onResp = async (resp: any) => {
    const u = resp.url();
    if (!XGRIT_ENDPOINT.test(u)) return;
    try { if ((resp.headers()["content-type"] || "").includes("json")) products.push(...productsFromXgrit(u, await resp.json())); } catch { /* ignore */ }
  };
  pg.on("response", onResp);
  try { await pg.goto(url, { waitUntil: "networkidle", timeout: 45000 }); await pg.waitForTimeout(2500); } catch { /* keep what we captured */ }
  pg.off("response", onResp);
  return products;
}

// Multi-course states expose several tiers; the "headline" course is an editorial
// pick. Pinned by stable courseId per BRAND (chosen + human-verified). `expect`
// lets a sync flag when a pinned course's price moves.
type Pin = { course: string; expect: number; note: string };
export const PINS: Record<string, Record<string, Pin>> = {
  idrivesafely: {
    TX: { course: "fTxVCkcwMlsyMPwg", expect: 25, note: "Defensive Driving (DIP)" },
    WI: { course: "dNKcMcLYyYrBdpnw", expect: 29, note: "court-referred traffic school" },
    WA: { course: "JCHkgz8Z19O2SXwz", expect: 49, note: "defensive driving (level 1/2)" },
    NC: { course: "EmZWC8lHn8Egv3Cj", expect: 59, note: "8-hour (most counties)" },
    DE: { course: "VgDI3fdnpxonHYkW", expect: 16, note: "defensive driving" },
  },
  aceable: {
    TX: { course: "E2OHeQFVa9XGWy7p", expect: 29, note: "defensive driving (standard, not the audio upsell)" },
  },
};

export type Resolved =
  | { status: "auto" | "pinned"; current: number; regular: number; options: Product[]; note?: string; drift?: string }
  | { status: "multi-unpinned" | "pin-missing" | "none"; current: null; regular: null; options: Product[]; note?: string };

// Turn a state's raw products into a single card price — safely. A NEW multi-course
// state is flagged (never guessed); a pinned course that vanished is flagged; a
// pinned course whose price moved is used but its drift surfaced.
export function resolvePrice(brand: string, code: string, products: Product[]): Resolved {
  const distinct = [...new Map(products.map((p) => [p.current, p])).values()].sort((a, b) => a.current - b.current);
  if (!distinct.length) return { status: "none", current: null, regular: null, options: [] };
  const pin = PINS[brand]?.[code];
  if (pin) {
    const hit = products.find((p) => p.course === pin.course);
    if (!hit) return { status: "pin-missing", current: null, regular: null, options: distinct, note: pin.note };
    const drift = Math.abs(hit.current - pin.expect) > 0.5 ? `pinned course price moved ${pin.expect} -> ${hit.current}` : undefined;
    return { status: "pinned", current: hit.current, regular: hit.regular, options: distinct, note: pin.note, drift };
  }
  if (distinct.length === 1) return { status: "auto", current: distinct[0].current, regular: distinct[0].regular, options: distinct };
  return { status: "multi-unpinned", current: null, regular: null, options: distinct, note: "new multi-course state — add a PIN" };
}

export async function withBrowser<T>(fn: (pg: Page) => Promise<T>): Promise<T> {
  const browser = await chromium.launch({ headless: true });
  const pg = await browser.newPage();
  await pg.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });
  try { return await fn(pg); } finally { await browser.close(); }
}
