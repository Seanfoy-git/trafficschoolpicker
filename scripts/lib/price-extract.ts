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
