import {
  getSchoolPricingForState,
  getStateInfo,
  getDirectoryForState,
  getStateRequirements,
  getSchoolVariantsForState,
  resolveStateContent,
  getAllSchools,
  PRICE_NOT_PUBLISHED,
  SEE_PRICE_ON_SITE,
} from "./notion";
import { buildStateComparison, usesComparisonLayout, type StateComparison } from "./comparison";
import { getStateBySlug } from "./state-utils";
import type { ResolvedSchoolContent } from "./types";

// The online statuses that render the comparison cards (and so a comparison).
export const ONLINE_COMPARISON_STATUSES: ReadonlySet<string> = new Set([
  "Online — ticket dismissal",
  "Online — insurance discount only",
  "Online — court discretion",
  "Online — point reduction",
]);

/**
 * States whose benefit runs only through named providers, none of which we list
 * (P0, 30 Oct 2026). No card, tracker link or Product/Offer markup renders here:
 * a card would sell a course that can't deliver the state's benefit. A school
 * returns only once it is confirmed against the regulator's own list (add its
 * slug to `qualifyingSlugs`).
 *  - Washington DC: the DC DMV lists two approved online providers for point
 *    removal, American Safety Council and Online Traffic School Inc.
 *    (dmv.dc.gov). We list neither; trafficschoolonline.com is not assumed to be
 *    "Online Traffic School Inc." until confirmed there.
 */
export const NAMED_PROVIDER_STATES: Readonly<Record<string, { qualifyingSlugs: readonly string[] }>> = {
  "washington-dc": { qualifyingSlugs: [] },
};

// Program types whose online course is the program a card qualifies for. In
// court-discretion states the court sets any course and its length, so no
// state-level length describes a card there.
const CARD_PROGRAM_STATUSES: ReadonlySet<string> = new Set([
  "Online — ticket dismissal",
  "Online — insurance discount only",
  "Online — point reduction",
]);

/**
 * The course length a school card (and its Product markup) may print: the
 * state's sourced length, only when it describes the program the card
 * qualifies for (P0, 30 Oct 2026). Null for court-discretion states, and for a
 * length that belongs to a classroom or in-person program (e.g. Georgia's
 * 6-hour DDS classroom course on an online card).
 */
export function cardCourseHours(stateInfo: { onlineStatus: string; courseHours: string | null } | null | undefined): string | null {
  const hours = stateInfo?.courseHours ?? null;
  if (!hours || !CARD_PROGRAM_STATUSES.has(stateInfo!.onlineStatus)) return null;
  if (/classroom|in[- ]person|zoom/i.test(hours)) return null;
  return hours;
}

/**
 * A card's pros minus any that contradict the same school's verified comparison
 * row (P0, 30 Oct 2026): "No final exam required" against a row that says the
 * course has a final exam, or "no timers" against a row that says it has them.
 * The row is checked against the school's own page; a pro that disagrees is
 * dropped (never reworded) and logged so its Notion source can be corrected.
 */
export function prosAgreeingWithRow(
  pros: string[],
  row: { finalExam: { text: string }; timers: { text: string } } | undefined,
  where: string
): string[] {
  if (!row) return pros;
  const contradicts = (p: string) =>
    (row.finalExam.text === "Yes" && /\bno (final )?exam\b|\bwithout (a |any )?(final )?exam\b/i.test(p)) ||
    (row.finalExam.text === "No" && /\b(final )?exam (is )?required\b|\bincludes? a final exam\b/i.test(p)) ||
    (row.timers.text === "Yes" && /\bno (lesson |page |course |chapter )?timers?\b|\bwithout (lesson |page )?timers?\b/i.test(p));
  const kept = pros.filter((p) => !contradicts(p));
  for (const p of pros) if (contradicts(p)) console.warn(`[card-pros] ${where}: dropped "${p}" (contradicts the comparison row)`);
  return kept;
}

export const noPriceLabel = (r: ResolvedSchoolContent) =>
  r.priceCheckedUnpublished ? PRICE_NOT_PUBLISHED : SEE_PRICE_ON_SITE;

/**
 * Everything the state page, its metadata and its JSON-LD derive the comparison
 * from. Every fetch here is build-memoized in lib/notion (one query per table per
 * build), so generateMetadata calling this too costs no extra Notion requests.
 */
export async function loadStateData(stateSlug: string) {
  const stateMeta = getStateBySlug(stateSlug);
  if (!stateMeta) return null;
  const [schools, stateInfo, directory, stateReqs, variants, allSchools] = await Promise.all([
    getSchoolPricingForState(stateMeta.code),
    getStateInfo(stateMeta.code),
    getDirectoryForState(stateMeta.name),
    getStateRequirements(),
    getSchoolVariantsForState(stateMeta.code),
    getAllSchools(),
  ]);
  const onlineStatus = stateInfo?.onlineStatus ?? "Unknown";
  // State grids are Tier 1 only. Tier 2 schools appear in the /schools directory only.
  // Named-provider states keep only schools confirmed on the regulator's list.
  const restricted = NAMED_PROVIDER_STATES[stateSlug];
  const tier1 = schools.filter((s) => s.tier === 1 && (!restricted || restricted.qualifyingSlugs.includes(s.slug)));
  // The comparison grid (and its Product/ItemList schema) render only for online
  // states that actually have tier-1 schools — the single gate shared below.
  // noPartnerOffer suppresses it even where the program exists (we list no offer):
  // the driver is pointed at the official approved-school list + directory instead.
  const noPartnerOffer = stateInfo?.noPartnerOffer ?? false;
  const showComparison = !noPartnerOffer && ONLINE_COMPARISON_STATUSES.has(onlineStatus) && tier1.length > 0;
  // Resolve each tier-1 school's per-state content once and share it between the
  // cards and the JSON-LD, so the schema price can never drift from the card price.
  const tier1Resolved = tier1.map((school) => ({
    school,
    resolved: resolveStateContent(school, stateMeta.code, stateReqs, variants),
  }));

  // P17 comparison table. Tier 1 = the cards that render (none under noPartnerOffer,
  // e.g. Arizona, whose table is the directory's priced schools only).
  let comparison: StateComparison | null = null;
  if (ONLINE_COMPARISON_STATUSES.has(onlineStatus)) {
    const built = buildStateComparison({
      stateCode: stateMeta.code,
      stateInfo,
      stateReq: stateReqs.get(stateMeta.code),
      tier1: showComparison ? tier1Resolved : [],
      variants,
      directory,
      allSchools,
      noPriceLabel,
    });
    if (usesComparisonLayout(stateSlug, stateInfo, built)) comparison = built;
  }
  const stateReq = stateReqs.get(stateMeta.code);
  return { stateReq, stateMeta, stateInfo, directory, tier1, tier1Resolved, showComparison, noPartnerOffer, onlineStatus, comparison, allSchools };
}

