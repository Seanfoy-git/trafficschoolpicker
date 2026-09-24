import type {
  DirectorySchool,
  ResolvedSchoolContent,
  School,
  SchoolStateVariant,
  SchoolWithPrice,
  StateInfo,
  StateRequirement,
} from "./types";
import { buildAffiliateLink } from "./affiliate";

/**
 * P17 — the state comparison table ("comparison first, every row priced").
 *
 * One pure builder shared by the state page, its metadata, the ItemList JSON-LD and
 * the llms generator, so the row count, the price range and the "Prices verified"
 * date can never drift between surfaces. Every school-fact cell either links the
 * page it was read from or reads "Not stated"; nothing here invents a value.
 *
 * Rows come in two tiers:
 *  - Tier 1: the reviewed schools that render cards, in card (P12) order, linked
 *    through the tracker exactly as the cards are. Priced only when the Pricing-DB
 *    row records a source URL and a checked date (resolved.priceSource).
 *  - Tier 2: licensed schools from the state's directory that we priced from the
 *    school's own site (Directory DB Price / Price Source URL / Price Checked), up to
 *    TIER2_MAX, price ascending then name. Linked direct, never through the tracker.
 */

// Rollout gate (P17 brief: four states first, the rest only after Sean reviews
// them). A state also needs its States DB "Program Name" set, since the H1, title
// and method statement are generated from it.
export const P17_LAYOUT_STATES: ReadonlySet<string> = new Set(["california", "texas", "florida", "arizona"]);

export const TIER2_MAX = 20;
// Tex. Educ. Code § 1001.352 (HB 3012, eff. 1 Sep 2025): no Texas driving safety
// course may be sold below $25.00. A lower scraped figure is a scrape error.
export const TX_PRICE_FLOOR = 25;
export const NOT_STATED = "Not stated";

// Affiliate networks that mean a real paid relationship exists for a school.
const AFFILIATE_NETWORKS = new Set(["Direct", "Impact", "CJ", "ShareASale"]);

export type Cell = { text: string; href: string | null };

export type ComparisonRow = {
  key: string;
  tier: 1 | 2;
  name: string;
  href: string;
  rel: string;
  /** Tier 1 only: the school's review slug (Product url + TSP Score context). */
  slug: string | null;
  price: number | null;
  priceIncludesFees: boolean;
  /** "$29.00", or the no-price label for an unpriced row. */
  priceText: string;
  priceChecked: string | null;
  /** The school page the row was verified from (the Source column). */
  sourceUrl: string;
  courseLength: Cell;
  timers: Cell;
  finalExam: Cell;
  reporting: Cell;
  tspScore: number | null;
  /** Tier 1: the page's affiliate hop is monetized (drives the disclosure line). */
  monetized: boolean;
};

export type StateComparison = {
  rows: ComparisonRow[];
  count: number;
  pricedCount: number;
  minPrice: number | null;
  maxPrice: number | null;
  /** Most recent Price Checked across priced rows (ISO), rendered day-level. */
  verifiedIso: string | null;
  verifiedLabel: string | null;
  programNoun: string;
  programNounPlural: string;
  regulator: string;
  /** Directory row count — the single source for every "{D} schools" count. */
  directoryCount: number;
  hasMonetizedLink: boolean;
  anyFeesFolded: boolean;
  /** Tier 2 rows dropped for a Texas price under the statutory floor (logged). */
  belowFloor: { name: string; price: number; url: string }[];
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** ISO date → "24 September 2026" (UTC, so no timezone drift). */
export function dayLabel(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function formatPrice(n: number): string {
  return `$${n.toFixed(2)}`;
}

export function hostOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

/** "CA DMV" after "California" reads "California CA DMV"; drop the leading code. */
export function regulatorAfterStateName(regulator: string, stateCode: string): string {
  return regulator.replace(new RegExp(`^${stateCode}\\s+`), "");
}

/** Price shown for a tier-1 row: identical to the card (and its Offer). */
function tier1DisplayedPrice(school: SchoolWithPrice, resolved: ResolvedSchoolContent): number | null {
  if (resolved.price === null) return null;
  if (school.hasActiveOffer && school.salePrice !== null && school.salePrice < resolved.price) return school.salePrice;
  return resolved.price;
}

function cell(text: string | null, href: string | null): Cell {
  return text && href ? { text, href } : { text: NOT_STATED, href: null };
}

/** State-rule fallbacks: only an affirmative, SOURCED program rule fills a cell. */
function stateRuleCells(stateInfo: StateInfo | null, req: StateRequirement | undefined) {
  const submit = stateInfo?.certificateSubmission ?? null;
  const reportingRule =
    submit === "School Submits" ? "School reports" : submit === "Driver Submits" ? "Driver submits" : null;
  return {
    courseLength: cell(stateInfo?.courseHours ?? null, stateInfo?.hoursSourceUrl ?? null),
    timers: cell(req?.hasLessonTimers ? "Yes" : null, req?.timersSourceUrl ?? null),
    finalExam: cell(req?.hasFinalExam ? "Yes" : null, req?.finalExamSourceUrl ?? null),
    reporting: cell(reportingRule, req?.reportingSourceUrl ?? null),
  };
}

export function buildStateComparison(input: {
  stateCode: string;
  stateInfo: StateInfo | null;
  stateReq: StateRequirement | undefined;
  /** Tier-1 schools that render cards, in card order (empty when no cards render). */
  tier1: { school: SchoolWithPrice; resolved: ResolvedSchoolContent }[];
  variants: Map<string, SchoolStateVariant>;
  directory: DirectorySchool[];
  /** Every Schools-DB school: dedupes tier 2 against tier 1 and detects affiliates. */
  allSchools: School[];
  noPriceLabel: (resolved: ResolvedSchoolContent) => string;
}): StateComparison {
  const { stateCode, stateInfo, stateReq, tier1, variants, directory, allSchools } = input;
  const rule = stateRuleCells(stateInfo, stateReq);
  const noun = stateInfo?.programName ?? "traffic school";

  const rows: ComparisonRow[] = [];

  for (const { school, resolved } of tier1) {
    const v = variants.get(`${school.slug}:${stateCode}`);
    const link = buildAffiliateLink({
      school: { slug: school.slug, name: school.name },
      affiliateProgram: {
        trackingMethod: school.trackingMethod,
        networkUrl: school.stateAffiliateUrl || school.affiliateUrl,
        partnerSlug: school.partnerSlug,
        couponCode: school.couponCode,
        destinationUrl: school.website,
      },
      stateCode,
      sourcePageId: school.id,
    });
    const price = resolved.priceSource ? tier1DisplayedPrice(school, resolved) : null;
    const variantExam =
      v?.hasFinalExamOverride && v.finalExamSourceUrl ? cell(v.hasFinalExamOverride, v.finalExamSourceUrl) : null;
    rows.push({
      key: `t1:${school.slug}`,
      tier: 1,
      name: school.name,
      href: link.href,
      rel: link.tracked ? `noopener noreferrer ${link.rel}` : "noopener noreferrer nofollow",
      slug: school.slug,
      price,
      priceIncludesFees: price !== null && (resolved.priceSource?.includesFees ?? false),
      priceText: price !== null ? formatPrice(price) : input.noPriceLabel(resolved),
      priceChecked: price !== null ? (resolved.priceSource?.checked ?? null) : null,
      sourceUrl: resolved.priceSource?.url ?? school.priceSourceUrl ?? school.website,
      courseLength: rule.courseLength,
      timers: v?.timers && v.timersSourceUrl ? cell(v.timers, v.timersSourceUrl) : rule.timers,
      finalExam: variantExam ?? rule.finalExam,
      reporting:
        v?.completionReporting && v.reportingSourceUrl ? cell(v.completionReporting, v.reportingSourceUrl) : rule.reporting,
      tspScore: school.tspScore,
      monetized: link.tracked,
    });
  }

  // Tier 2: priced directory rows, one per school site, never a school already
  // shown as a tier-1 row.
  const tier1Hosts = new Set(tier1.map(({ school }) => hostOf(school.website)).filter(Boolean) as string[]);
  const schoolByHost = new Map<string, School>();
  for (const s of allSchools) {
    const h = hostOf(s.website);
    if (h) schoolByHost.set(h, s);
  }
  const belowFloor: StateComparison["belowFloor"] = [];
  const byHost = new Map<string, DirectorySchool>();
  for (const d of directory) {
    if (d.price == null || !d.priceSourceUrl || !d.priceChecked) continue;
    const host = hostOf(d.priceSourceUrl) ?? hostOf(d.website);
    if (!host || tier1Hosts.has(host)) continue;
    if (stateCode === "TX" && d.price < TX_PRICE_FLOOR) {
      belowFloor.push({ name: d.displayName ?? d.name, price: d.price, url: d.priceSourceUrl });
      continue;
    }
    const prev = byHost.get(host);
    if (!prev || (prev.price ?? Infinity) > d.price) byHost.set(host, d);
  }
  const tier2 = [...byHost.entries()]
    .map(([host, d]) => ({ host, d, name: d.displayName ?? d.name }))
    .sort((a, b) => (a.d.price! - b.d.price!) || a.name.localeCompare(b.name))
    .slice(0, TIER2_MAX);
  for (const { host, d, name } of tier2) {
    const partner = schoolByHost.get(host);
    const sponsored = !!partner && AFFILIATE_NETWORKS.has(partner.affiliateNetwork ?? "");
    rows.push({
      key: `t2:${d.id}`,
      tier: 2,
      name,
      href: d.priceSourceUrl!,
      rel: sponsored ? "nofollow sponsored noopener noreferrer" : "nofollow noopener noreferrer",
      slug: null,
      price: d.price,
      priceIncludesFees: d.priceIncludesFees,
      priceText: formatPrice(d.price!),
      priceChecked: d.priceChecked,
      sourceUrl: d.priceSourceUrl!,
      courseLength: rule.courseLength,
      timers: d.timers && d.timersSourceUrl ? cell(d.timers, d.timersSourceUrl) : rule.timers,
      finalExam: d.finalExam && d.finalExamSourceUrl ? cell(d.finalExam, d.finalExamSourceUrl) : rule.finalExam,
      reporting:
        d.completionReporting && d.reportingSourceUrl ? cell(d.completionReporting, d.reportingSourceUrl) : rule.reporting,
      tspScore: null,
      monetized: false,
    });
  }

  const priced = rows.filter((r) => r.price !== null);
  const prices = priced.map((r) => r.price!);
  const verifiedIso = priced.reduce<string | null>(
    (max, r) => (r.priceChecked && (!max || r.priceChecked > max) ? r.priceChecked : max),
    null
  );
  return {
    rows,
    count: rows.length,
    pricedCount: priced.length,
    minPrice: prices.length ? Math.min(...prices) : null,
    maxPrice: prices.length ? Math.max(...prices) : null,
    verifiedIso,
    verifiedLabel: verifiedIso ? dayLabel(verifiedIso) : null,
    programNoun: noun,
    programNounPlural: `${noun}s`,
    regulator: stateReq?.approvalBodyShort || "state",
    directoryCount: directory.length,
    hasMonetizedLink: rows.some((r) => r.monetized),
    anyFeesFolded: priced.some((r) => r.priceIncludesFees),
    belowFloor,
  };
}

// ─── Generated copy (Task 2a/4) ─────────────────────────────

export function comparisonH1(c: StateComparison, stateName: string): string {
  return `Which online ${c.programNoun} should I use in ${stateName}?`;
}

export function comparisonTitle(c: StateComparison, stateName: string, year: number): string {
  // The root layout's title template appends " | TrafficSchoolPicker".
  return `${comparisonH1(c, stateName)} ${c.count} schools compared (${year})`;
}

export function comparisonSubhead(c: StateComparison): string {
  const date = c.verifiedLabel ? ` Prices verified ${c.verifiedLabel}.` : "";
  return `${c.count} ${c.regulator}-approved schools compared on price and rules.${date}`;
}

export function comparisonH2(c: StateComparison, stateName: string): string {
  return `Compare ${c.count} online ${c.programNounPlural} in ${stateName}`;
}

/** Who completion reaches: the administering agency where the record names one, else the court. */
function submitter(stateInfo: StateInfo | null): string {
  const body = stateInfo?.administeringBody;
  return body && /^(DMV|BMV|MVA|DPS)$/.test(body) ? body : "court";
}

export function methodStatement(c: StateComparison, stateName: string, stateCode: string, stateInfo: StateInfo | null): string {
  const reg = regulatorAfterStateName(c.regulator, stateCode);
  const date = c.verifiedLabel ? ` Prices verified ${c.verifiedLabel}.` : "";
  return (
    `We compared ${c.count} ${stateName} ${reg}-approved online ${c.programNounPlural} on price, course length, ` +
    `timers, final exam and how completion reaches the ${submitter(stateInfo)}, using each school's own site.${date}`
  );
}

export function comparisonMetaDescription(c: StateComparison, stateName: string, stateCode: string, benefit: string | null): string {
  const reg = regulatorAfterStateName(c.regulator, stateCode);
  const range =
    c.minPrice !== null && c.maxPrice !== null
      ? c.minPrice === c.maxPrice
        ? ` (${formatPrice(c.minPrice)})`
        : ` (${formatPrice(c.minPrice)} to ${formatPrice(c.maxPrice)})`
      : "";
  const facts = `compared on price${range}, course length, timers, exam and reporting`;
  const base = `${c.count} ${stateName} ${reg}-approved online ${c.programNounPlural} ${facts}, each fact linked to the school's own page.`;
  // Cap at 160 characters. The brief's template first; drop the benefit phrase
  // first, then shorten the least load-bearing words, one step at a time, keeping
  // the count, the state, the program and the price range to the last.
  const candidates = [
    benefit ? `${base} ${benefit}` : null,
    base,
    `${c.count} ${stateName} ${reg}-approved online ${c.programNounPlural} ${facts}, each linked to its source.`,
    `${c.count} ${stateName} ${reg}-approved ${c.programNounPlural} ${facts}, each linked to its source.`,
    `${c.count} ${stateName} online ${c.programNounPlural} ${facts}, each linked to its source.`,
    `${c.count} ${stateName} online ${c.programNounPlural} ${facts}.`,
  ].filter((x): x is string => x !== null);
  return candidates.find((x) => x.length <= 160) ?? candidates[candidates.length - 1];
}

/** Whether a state renders the P17 comparison-first layout. */
export function usesComparisonLayout(stateSlug: string, stateInfo: StateInfo | null, c: StateComparison | null): boolean {
  return P17_LAYOUT_STATES.has(stateSlug) && !!stateInfo?.programName && !!c && c.count > 0;
}
