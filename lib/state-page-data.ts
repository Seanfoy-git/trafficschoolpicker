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
  const tier1 = schools.filter((s) => s.tier === 1);
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
  return { stateMeta, stateInfo, directory, tier1, tier1Resolved, showComparison, noPartnerOffer, onlineStatus, comparison, allSchools };
}

