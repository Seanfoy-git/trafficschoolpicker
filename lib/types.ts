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
  | 'In-person only'
  | 'Unknown';

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
  // Content
  stateCodes: string[];          // ["CA","TX","FL"] or ["all"]
  pros: string[];
  cons: string[];
  // State-specific pros/cons — keyed by state code, read from "Pros CA" / "Cons GA" etc.
  statePros: Record<string, string[]>;
  stateCons: Record<string, string[]>;
  bestFor: string;
  notFor: string;
  completionHours: number | null;
  mobileApp: boolean;
  moneyBackGuarantee: boolean;
  certificateDelivery: 'Electronic' | 'Mail' | 'Both' | null;
  courtAcceptance: 'All Courts' | 'Most Courts' | 'Some Courts' | null;
  founded: number | null;
  showOnSite: boolean;
  lastVerified: string | null;
  genericPrice: number | null;  // "Price" field from Traffic Schools DB — fallback when no state-specific price
  statePrices: Partial<Record<string, number>>;  // per-state price columns: { CA: 24.95, TX: 19.95, ... }
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
  originalPrice: number | null;
  stateAffiliateUrl: string | null;  // overrides school.affiliateUrl if set
  priceNote: string | null;
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
  mandatedHours: number | null;
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
