/**
 * Pure price extraction + validation for the price scraper (WS1 hardening).
 *
 * The old extractor took Math.min of every "$NN" on the page — so a stray
 * coupon/upsell figure ("$5 off", "$3 processing") became the course price,
 * and it was written to a live card Approved=true. This module replaces that
 * with keyword-proximate median extraction plus a validation gate that
 * QUARANTINES implausible values instead of shipping them.
 *
 * No side effects — safe to unit test.
 */

// Absolute sanity band: outside this, the number is not a course price.
export const HARD_MIN = 3;
export const HARD_MAX = 150;
// First-time (no prior) trust band: a brand-new value only auto-writes inside it.
export const CONFIDENT_MIN = 12;
export const CONFIDENT_MAX = 99;
// Max change vs the prior stored price before we quarantine for human review.
export const MAX_DEVIATION = 0.35;

const PRICE_RE = /\$\s*(\d{1,3}(?:\.\d{1,2})?)/g;
const PRICE_KEYWORDS = /(price|enroll|only|course|checkout|total|tuition|\bfee\b|\bpay\b)/i;
// The stable, comparable price. Traffic-school sites run perpetual fake-urgency
// "Regular $34.95 / Sale Price $5.94 — offer ends 12:00" banners; the sale figure
// is an unstable loss-leader (this is where the recurring $5.94 junk came from).
// Prefer the regular/list price when the page advertises one.
const REGULAR_ANCHOR = /(regular(?:ly)?|list price|reg\.?\s*price|\bwas\b|originally)\s*:?\s*$/i;
// Words that typically sit IMMEDIATELY before the real price ("only $29",
// "just $19.95", "price: $24.95", "for $29") — a much stronger signal than
// mere proximity, and not triggered by "Save $5" / "Add-on $3" decoys.
const PRICE_ANCHOR = /(only|just|price|total|tuition|cost|checkout|starting at|\bfor\b|\bpay\b)\s*:?\s*$/i;

export function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function candidates(text: string): { v: number; idx: number }[] {
  const out: { v: number; idx: number }[] = [];
  let m: RegExpExecArray | null;
  PRICE_RE.lastIndex = 0;
  while ((m = PRICE_RE.exec(text)) !== null) {
    const v = parseFloat(m[1]);
    if (v >= HARD_MIN && v <= HARD_MAX) out.push({ v, idx: m.index });
  }
  return out;
}

/**
 * Pick a price from page/selector text. Prefers "$" figures near price-context
 * keywords, and returns the MEDIAN of the chosen set (robust to a single stray
 * coupon figure that used to win via Math.min). Returns null if nothing sane.
 */
export function pickPrice(text: string, fromSelector: boolean): number | null {
  const cands = candidates(text);
  if (cands.length === 0) return null;
  if (fromSelector) return median(cands.map((c) => c.v)); // selector text is already narrow

  // 0) Highest priority: a "Regular/List $X" figure beats a "Sale Price $Y" decoy.
  const regular = cands.filter((c) => REGULAR_ANCHOR.test(text.slice(Math.max(0, c.idx - 15), c.idx)));
  if (regular.length) return median(regular.map((c) => c.v));

  // 1) Prefer figures directly anchored by a price word ("only $29", "for $19.95").
  const anchored = cands.filter((c) => PRICE_ANCHOR.test(text.slice(Math.max(0, c.idx - 20), c.idx)));
  if (anchored.length) return median(anchored.map((c) => c.v));

  // 2) Else figures merely near price-context keywords.
  const near = cands.filter((c) => PRICE_KEYWORDS.test(text.slice(Math.max(0, c.idx - 40), c.idx + 40)));
  if (near.length) return median(near.map((c) => c.v));

  // 3) Else median of all sane candidates (robust to a single stray figure).
  return median(cands.map((c) => c.v));
}

// ─── Offer detection (daily promo pass) ─────────────────────
//
// Separate from pickPrice (which returns the stable REGULAR anchor): this looks
// for a live promo — a sale price BELOW the regular, plus a human-readable label
// ("15% OFF", "$5 off"). Deliberately conservative: a false "offer" floats a
// card to the top of a state list with a "Limited-time offer" tag, so we only
// claim one on a plausible sale (a real discount, not a $5 processing fee) or an
// unambiguous "% off" banner. The regular anchor is passed in (the verified/
// displayed price), NOT re-derived, so the sale is judged against the truth.
const SALE_ANCHOR = /(sale|now|today|deal|special|instant|checkout)\s*(price)?\s*:?\s*$/i;
const OFFER_LABEL_RE = /(\d{1,3}\s*%\s*off|save\s*\$?\d{1,3}|\$\s*\d{1,3}\s*off|limited[-\s]?time|flash sale|\bsale\b)/i;

export interface OfferInfo {
  sale: number | null;   // current promo price, if a plausible one below regular was found
  label: string | null;  // e.g. "15% OFF" — null if no clear promo language
  hasOffer: boolean;     // a live promo is running (drives Active Offer + the card tag)
}

// A $-price occurrence on the page + whether it renders struck-through. The
// scraper collects these from the live DOM (innerText loses the strikethrough).
export interface PriceNode {
  value: number;
  struck: boolean;
}

export function detectOffer(
  text: string,
  regular: number | null,
  priceNodes: PriceNode[] = [],
  jsonLdPrices: number[] = []
): OfferInfo {
  const labelMatch = text.match(OFFER_LABEL_RE);
  const label = labelMatch ? labelMatch[0].replace(/\s+/g, " ").toUpperCase().trim() : null;

  let sale: number | null = null;

  // Primary source: JSON-LD Offer/AggregateOffer price is the reliable CURRENT
  // price — structured data present for SEO on these storefronts. The base course
  // is the cheapest tier, so the minimum offer price is its current price; if that
  // sits below the verified regular, it's the live sale. This surfaced iDriveSafely's
  // client-rendered "$24" (invisible to DOM text scraping) and fixed the aceable-TX
  // multi-tier mis-grab (min of [39, 29] = the standard $29) with no DOM heuristics.
  if (jsonLdPrices.length && regular != null && regular > 0) {
    const current = Math.min(...jsonLdPrices);
    if (current < regular * 0.98 && current >= regular * 0.3) sale = current;
  }

  // Strongest, most site-agnostic signal: a struck-through "was/regular" price
  // sitting above a cheaper live price = a genuine sale. This is how iDriveSafely's
  // "Now $24 / ~~$59~~" reads — it has no "%-off" words, so innerText alone missed
  // it. Reference the struck price nearest our verified regular (i.e. its own
  // tier), then take the best cheaper live figure above a 40%-of-regular floor —
  // which skips stacked-code deepest prices (an extra "$5 off" code) and state
  // fees ($8 NY processing).
  // priceNodes arrive in DOM order. On a multi-tier page the standard card renders
  // its "~~$49~~ $29" together, so pair the sale to the struck regular by DOM
  // ADJACENCY, not a global max/min (which grabbed the Handsfree tier's $39 on
  // aceable-TX). Reference the struck node nearest our verified regular (its own
  // tier); the sale is the nearest cheaper live node — preferring the one right
  // after it — within a 40%-of-regular floor (skips $5-off codes and state fees).
  if (sale == null && priceNodes.some((n) => n.struck)) {
    let refIdx = -1;
    priceNodes.forEach((n, i) => {
      if (!n.struck) return;
      if (refIdx < 0) { refIdx = i; return; }
      const cur = priceNodes[refIdx].value;
      const better = regular != null
        ? Math.abs(n.value - regular) < Math.abs(cur - regular)
        : n.value < cur;
      if (better) refIdx = i;
    });
    if (refIdx >= 0) {
      const ref = priceNodes[refIdx].value;
      let best = -1;
      priceNodes.forEach((n, i) => {
        if (n.struck || !(n.value < ref * 0.98 && n.value >= ref * 0.4)) return;
        if (best < 0) { best = i; return; }
        const scoreNew = Math.abs(i - refIdx) - (i > refIdx ? 0.5 : 0);       // ties → node after the struck price
        const scoreOld = Math.abs(best - refIdx) - (best > refIdx ? 0.5 : 0);
        if (scoreNew < scoreOld) best = i;
      });
      if (best >= 0) sale = priceNodes[best].value;
    }
  }

  // Fallback (single-price pages with no strikethrough): a sale-anchored figure
  // below the verified regular in the page text.
  if (sale == null && regular != null && regular > 0) {
    const saleCands = candidates(text)
      .filter((c) => c.v < regular * 0.98 && c.v >= regular * 0.4)
      .filter(
        (c) =>
          SALE_ANCHOR.test(text.slice(Math.max(0, c.idx - 12), c.idx)) ||
          PRICE_ANCHOR.test(text.slice(Math.max(0, c.idx - 20), c.idx))
      );
    if (saleCands.length) sale = Math.min(...saleCands.map((c) => c.v));
  }

  // Claim an offer on solid evidence: a sale below regular (from strikethrough or
  // an anchored figure), OR an explicit discount label ("% off" / "save $").
  const strongLabel = label != null && /(%|save|\boff\b)/i.test(label);
  const hasOffer = sale != null || strongLabel;
  return { sale, label, hasOffer };
}

export const NO_OFFER: OfferInfo = { sale: null, label: null, hasOffer: false };

export type ScrapeStatus = "OK" | "Needs Review" | "Failed" | "Blocked" | "Dead URL";
export interface PriceDecision {
  status: ScrapeStatus;
  writePrice: number | null; // number → write to Notion Price; null → leave live value untouched
  approve: boolean; // true → set Approved=true; false → DO NOT touch Approved (preserve prior human decision)
  reason: string;
}

/**
 * Decide what to do with a scraped candidate given the prior stored price.
 * Guarantees: a value that is out-of-band or a large change vs prior is
 * quarantined ("Needs Review") — never written over a live card, and Approved
 * is never auto-flipped for anything but a validated OK price.
 */
export function classify(candidate: number | null, prior: number | null, blocked: boolean): PriceDecision {
  if (blocked) return { status: "Blocked", writePrice: null, approve: false, reason: "page blocked (captcha/403)" };
  if (candidate === null) return { status: "Failed", writePrice: null, approve: false, reason: "no price parsed" };

  if (candidate < HARD_MIN || candidate > HARD_MAX)
    return { status: "Needs Review", writePrice: null, approve: false, reason: `out of sane band ($${candidate})` };

  if (prior != null && prior > 0) {
    const dev = Math.abs(candidate - prior) / prior;
    if (dev > MAX_DEVIATION)
      return {
        status: "Needs Review",
        writePrice: null,
        approve: false,
        reason: `${Math.round(dev * 100)}% change vs prior $${prior} → $${candidate}`,
      };
    return { status: "OK", writePrice: candidate, approve: true, reason: `stable $${prior}→$${candidate}` };
  }

  // No prior value: only auto-write inside the confident band; otherwise quarantine.
  if (candidate < CONFIDENT_MIN || candidate > CONFIDENT_MAX)
    return {
      status: "Needs Review",
      writePrice: null,
      approve: false,
      reason: `first-time value outside confident band ($${candidate})`,
    };
  return { status: "OK", writePrice: candidate, approve: true, reason: `first-time $${candidate}` };
}

// Drift from a HAND-VERIFIED anchor beyond this → re-verify (tighter than the
// generic MAX_DEVIATION: a verified Regular price shouldn't move much, and this
// is what catches wrong-variant grabs, e.g. handsfree $44 vs standard $34 = 29%).
export const VERIFIED_DRIFT = 0.2;

export interface RuleBand {
  verifiedPrice: number | null;
  expectedMin: number | null;
  expectedMax: number | null;
}

/**
 * Rule-driven classification for a Scraper Rules DB target. Gates on the rule's
 * own Expected Min/Max band and its hand-Verified Price anchor — a scrape that
 * drifts from the verified value is quarantined for RE-VERIFICATION rather than
 * clobbering the human-verified price.
 */
export function classifyAgainstRule(
  candidate: number | null,
  rule: RuleBand,
  blocked: boolean,
  dead: boolean
): PriceDecision {
  if (dead) return { status: "Dead URL", writePrice: null, approve: false, reason: "target URL is dead" };
  if (blocked) return { status: "Blocked", writePrice: null, approve: false, reason: "page blocked (captcha/403)" };
  if (candidate === null) return { status: "Failed", writePrice: null, approve: false, reason: "no price parsed" };

  const min = rule.expectedMin ?? HARD_MIN;
  const max = rule.expectedMax ?? HARD_MAX;
  if (candidate < min || candidate > max)
    return {
      status: "Needs Review",
      writePrice: null,
      approve: false,
      reason: `$${candidate} outside rule band [$${min}–$${max}]`,
    };

  if (rule.verifiedPrice != null && rule.verifiedPrice > 0) {
    const drift = Math.abs(candidate - rule.verifiedPrice) / rule.verifiedPrice;
    if (drift > VERIFIED_DRIFT)
      return {
        status: "Needs Review",
        writePrice: null,
        approve: false,
        reason: `${Math.round(drift * 100)}% drift vs verified $${rule.verifiedPrice} → $${candidate} — RE-VERIFY (variant/price change?)`,
      };
    // Confirms the verified anchor. Write the VERIFIED value, not the scrape, so
    // the hand-checked number stays exact and can't drift from parse noise.
    return {
      status: "OK",
      writePrice: rule.verifiedPrice,
      approve: true,
      reason: `confirms verified $${rule.verifiedPrice} (scrape $${candidate}, ±${Math.round(drift * 100)}%)`,
    };
  }

  // Verified rule with no anchor yet: in-band is the only gate.
  return { status: "OK", writePrice: candidate, approve: true, reason: `in band [$${min}–$${max}], no verified anchor` };
}
