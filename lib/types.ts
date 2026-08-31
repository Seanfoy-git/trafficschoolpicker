// ─── Rating types ───────────────────────────────────────────

export type PlatformRating = {
  platform: 'Trustpilot' | 'Google' | 'App Store' | 'Play Store';
  rating: number;
  reviewCount: number;
  previousRating: number | null;
  trend: 'up' | 'down' | 'stable';
  url: string | null;
};

export type BBBRating = {
  grade: string;  // "A+", "A", "B+", etc. or "NR"
  url: string | null;
};

// ─── States DB ──────────────────────────────────────────────

export type OnlineStatus =
  | 'Online — ticket dismissal'
  | 'Online — insurance discount only'
  | 'Online — court discretion'   // online courses exist, but acceptance is decided court-by-court (no statewide program) — e.g. KS, WY
  | 'Online — point reduction'    // a real online course reduces/credits points but does NOT dismiss the ticket — e.g. DC, DE, IN, NE
  | 'Court program only'          // no self-serve online course resolves a ticket; relief runs through a court program — e.g. IL supervision, KY State Traffic School
  | 'In-person only'
  | 'Unknown';

export type ContentStatus = 'Complete' | 'Partial' | 'Stub';

export type StateFaqEntry = { q: string; a: string };

export type StateInfo = {
  id: string;
  code: string;                  // "CA"
  name: string;                  // "California"
  onlineAllowed: boolean;
  onlineDismissesTicket: boolean;
  insuranceDiscountAvailable: boolean;
  onlineStatus: OnlineStatus;    // derived from the checkboxes
  dmvUrl: string;
  notes: string;
  eligibility: string;
  courtNotes: string;
  certificateSubmission: string | null;
  minHours: number | null;
  status: string;                // "Research Complete" / "In Progress" / "Not Started"
  // Per-state page-content fields (added for uniqueness uplift)
  introParagraph: string;
  trueCostOfATicket: string | null;  // "True Cost of a Ticket" prose; null when unset
  stateFaq: StateFaqEntry[];     // parsed from JSON; empty array if missing/malformed
  lastVerified: string | null;   // ISO date — drives the "Last verified" header chip
  contentStatus: ContentStatus | null;  // null treated as Stub for sitemap inclusion
  // Per-state TrustBar approval label. Null → the site default ("All schools
  // court-approved"). Set where "court-approved" is wrong (e.g. NY PIRP is a DMV
  // program, not court-administered → "DMV-approved (PIRP)").
  approvalLabel: string | null;
  // True when the state has a real program but we list no partner offer: suppress
  // the comparison grid and point drivers at the official approved-school list +
  // the directory below (e.g. Arizona DDS).
  noPartnerOffer: boolean;
  // SINGLE SOURCE OF TRUTH for course length. `courseHours` is a display string
  // ("8 hours", "320 minutes (5h20m)", "4 to 4.5 hours") and is null unless
  // `hoursSource` is set — an unsourced hours value renders NOWHERE. There is no
  // per-school hours field; every hour claim sitewide reads this. See Package 4.
  courseHours: string | null;
  hoursSource: string | null;    // primary-source cite (statute/regulator URL)
  hoursVerified: string | null;  // ISO date — powers the hours "Last verified" line
};

// ─── Traffic Schools DB (editorial + reviews) ───────────────

export type School = {
  id: string;                    // Notion page ID
  slug: string;
  name: string;
  tier: 1 | 2;
  badge: 'Top Rated' | 'Editors Choice' | 'Best Value' | 'Fastest' | 'Budget Pick' | null;
  tagline: string;
  website: string;
  affiliateUrl: string;          // default affiliate link
  affiliateNetwork: 'CJ' | 'Impact' | 'ShareASale' | 'Direct' | 'Unknown' | null;
  commissionRate: string;
  // Ratings
  rating: number | null;
  reviewCount: number | null;
  reviewSource: 'Trustpilot' | 'Google' | 'Yelp' | 'BBB' | null;
  reviewUrl: string | null;
  ratings: PlatformRating[];
  bbb: BBBRating | null;
  synthesizedGood: string;
  synthesizedBad: string;
  // TSP Score — our independent six-dimension rubric score (Package 5), the ONLY
  // rating we present as ours. Computed (weighted mean of the six sub-scores, one
  // decimal); null unless all six sub-scores are set — i.e. the school has an
  // approved written review. Trustpilot/Google numbers are attributed only, never ours.
  tspScore: number | null;
  // Content
  stateCodes: string[];          // ["CA","TX","FL"] or ["all"]
  pros: string[];
  cons: string[];
  // State-specific pros/cons — keyed by state code, read from "Pros CA" / "Cons GA" etc.
  statePros: Record<string, string[]>;
  stateCons: Record<string, string[]>;
  bestFor: string;
  notFor: string;
  mobileApp: boolean;
  moneyBackGuarantee: boolean;
  certificateDelivery: 'Electronic' | 'Mail' | 'Both' | null;
  courtAcceptance: 'All Courts' | 'Most Courts' | 'Some Courts' | null;
  founded: number | null;
  showOnSite: boolean;
  lastVerified: string | null;
  genericPrice: number | null;  // "Price" field from Traffic Schools DB — fallback when no state-specific price
  statePrices: Partial<Record<string, number>>;  // per-state price columns: { CA: 24.95, TX: 19.95, ... }
  // Tracking method routing
  trackingMethod: 'network' | 'direct' | 'coupon_code' | null;
  partnerSlug: string;      // used when trackingMethod = 'direct'
  couponCode: string;       // used when trackingMethod = 'coupon_code'
};

// ─── School × State Pricing DB ──────────────────────────────

export type SchoolPricing = {
  id: string;
  schoolId: string;              // relation to Traffic Schools
  stateCode: string;
  price: number | null;
  originalPrice: number | null;
  approved: boolean;
  affiliateUrl: string;          // state-specific affiliate URL override
  priceNote: string;
};

// ─── Merged type for state pages ────────────────────────────

export type SchoolWithPrice = School & {
  price: number | null;          // state-specific price (overrides school default)
  pricingPrice: number | null;   // RAW Pricing-DB value (no generic fallback); the
                                 // verified price flows here and now outranks the
                                 // Schools "Price XX" column in the render waterfall
  originalPrice: number | null;
  stateAffiliateUrl: string | null;  // overrides school.affiliateUrl if set
  priceNote: string | null;
  hasActiveOffer: boolean;           // a live promo is running (Pricing DB "Active Offer");
                                     // floats the card to the top of the state list
  salePrice: number | null;          // current promo price to display struck-against the
                                     // regular; non-null only while hasActiveOffer is true
};

// ─── State Requirements DB ──────────────────────────────────

export type StateRequirement = {
  id: string;
  stateCode: string;
  stateName: string;
  officialTerm: string;
  approvalBody: string;
  approvalBodyShort: string;
  mandatedHours: number | null;
  hasFinalExam: boolean;
  examIsOpenBook: boolean;
  examAttemptsAllowed: number | null;
  hasLessonTimers: boolean;
  ticketOutcome: string;           // "Dismissed" | "Masked" | "Reduced"
  ticketOutcomeNote: string;
  eligibilityWindowMonths: number | null;
  certificateDelivery: string;
  courtFeeRequired: boolean;
  courtFeeNote: string;
  dmvLicenseRequired: boolean;
  licenseFormat: string;
  terminologyNotes: string;
  sourceUrl: string;
  lastVerified: string | null;
};

// ─── School State Variants DB ───────────────────────────────

export type SchoolStateVariant = {
  id: string;
  name: string;                    // "safe2drive:CA"
  schoolSlug: string;
  stateCode: string;
  generationStatus: 'Generated' | 'Locked' | 'Needs Review';
  lockReason: string;
  oneLiner: string;
  pros: string[];
  cons: string[];
  bestFor: string;
  notFor: string;
  priceOverride: number | null;
  hasFinalExamOverride: 'Yes' | 'No' | null;
  generationNotes: string;
  lastGenerated: string | null;
};

// ─── Resolved state content (frontend) ──────────────────────

export type ResolvedSchoolContent = {
  // Editorial
  oneLiner: string | null;
  pros: string[];                    // already split, never null — empty array if no data
  cons: string[];                    // already split, never null — empty array if no data
  bestFor: string | null;
  notFor: string | null;

  // Price
  price: number | null;
  priceDisplay: string;              // '$24.95' or 'Check website' — always a string

  // Regulatory — structural facts about this state
  officialTerm: string;
  approvalBody: string;
  approvalBodyShort: string;
  hasFinalExam: boolean;
  examAttemptsAllowed: number | null;
  examIsOpenBook: boolean;
  hasLessonTimers: boolean;
  ticketOutcome: string;
  ticketOutcomeNote: string | null;
  eligibilityWindowMonths: number | null;
  courtFeeRequired: boolean;
  courtFeeNote: string | null;
};

// ─── School Directory DB (DMV-scraped) ──────────────────────

export type DirectorySchool = {
  id: string;
  name: string;
  state: string;                 // "California"
  licenseNumber: string;
  phone: string;
  address: string;
  website: string | null;
  onlineAvailable: boolean;
  source: string;                // "CA DMV"
  lastScraped: string | null;
};

// ─── Review page body (Notion page block content) ───────────

// One formatted text run within a block, reduced to the marks we render.
export type ReviewRichText = {
  text: string;
  bold: boolean;
  italic: boolean;
  href: string | null;
};

export type ReviewBlockType =
  | 'paragraph'
  | 'heading_2'
  | 'heading_3'
  | 'bulleted_list_item'
  | 'numbered_list_item';

// A single rendered block from a school's Notion page body.
export type ReviewBlock = {
  type: ReviewBlockType;
  richText: ReviewRichText[];
};

// ─── STATE QUESTION PAGES (/{state}/{question-slug}) ─────────

// One Complete row from the Question Pages DB (metadata; body fetched separately).
export type QuestionPage = {
  id: string;              // Notion page id (also the body-block source)
  title: string;
  stateCode: string;
  stateSlug: string;
  questionSlug: string;
  h1: string;
  titleTag: string;
  metaDescription: string;
  lastVerified: string | null; // ISO date
  sources: string;             // raw Sources property text (primary URLs)
};

export type QuestionKeyFact = { label: string; value: string };

// The parsed page body, split by the `## Key Facts` / `## Body` / `## Sources`
// heading_2 markers. `hasQA` gates whether an FAQPage node is emitted.
export type QuestionBody = {
  keyFacts: QuestionKeyFact[];
  body: ReviewBlock[];
  sources: ReviewBlock[];
  hasQA: boolean;
};
