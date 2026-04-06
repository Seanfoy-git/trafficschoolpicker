export type PlatformRating = {
  platform: 'Trustpilot' | 'Google' | 'Yelp';
  rating: number;
  reviewCount: number;
  previousRating: number | null;
  trend: 'up' | 'down' | 'stable';
  url: string | null;
};

export type School = {
  id: string;                    // Notion page ID
  slug: string;                  // e.g. "idrivesafely"
  name: string;
  tier: 1 | 2;
  badge: 'Top Rated' | 'Editors Choice' | 'Best Value' | 'Fastest' | 'Budget Pick' | null;
  tagline: string;               // from "One Liner" in Notion
  website: string;
  affiliateUrl: string;          // empty string if not set yet
  affiliateNetwork: 'CJ' | 'Impact' | 'ShareASale' | 'Direct' | 'Unknown' | null;
  commissionRate: string;
  price: number;
  priceCA: number | null;
  priceTX: number | null;
  priceFL: number | null;
  priceNY: number | null;
  originalPrice: number | null;
  // Legacy single rating (kept for backwards compat / fallback)
  rating: number | null;
  reviewCount: number | null;
  reviewSource: 'Trustpilot' | 'Google' | 'Yelp' | 'BBB' | null;
  reviewUrl: string | null;
  // Multi-platform ratings
  ratings: PlatformRating[];
  synthesizedPros: string[];
  synthesizedCons: string[];
  stateCodes: string[];          // ["CA","TX","FL"] or ["all"] meaning all 50
  pros: string[];                // split on newlines from Notion text field
  cons: string[];
  bestFor: string;
  completionHours: number | null;
  mobileApp: boolean;
  moneyBackGuarantee: boolean;
  certificateDelivery: 'Electronic' | 'Mail' | 'Both' | null;
  courtAcceptance: 'All Courts' | 'Most Courts' | 'Some Courts' | null;
  founded: number | null;
  showOnSite: boolean;
  lastVerified: string | null;   // ISO date string
};

export type DirectorySchool = {
  id: string;                    // Notion page ID
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

export type StateInfo = {
  id: string;
  code: string;                  // "CA"
  name: string;                  // "California"
  onlineAllowed: boolean;
  minHours: number | null;
  programName: string;           // "Traffic Violator School" / "Defensive Driving" etc
  eligibilityNotes: string;
  courtProcess: string;
  dmvUrl: string;
  lastUpdated: string | null;
};
