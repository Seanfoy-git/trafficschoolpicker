export type PriceTarget = {
  schoolSlug: string;
  state: "CA" | "TX" | "FL" | "NY";
  url: string;
  method: "dom" | "fixed";
  fixedPrice?: number;
  selector?: string | null;
  priceRegex?: string;
  notes?: string;
};

export const priceTargets: PriceTarget[] = [
  // ─── iDriveSafely ───────────────────────────────────
  // IDS pricing is owned by scripts/sync-ids-prices.ts, which reads IDS's OWN
  // pricing API (authoritative current + regular per state). DOM-scraping IDS
  // only ever grabbed the struck REGULAR (the current price is rendered client-
  // side), so its targets/rules were RETIRED to stop it overwriting the API
  // values. Do NOT re-add IDS here or to the Scraper Rules DB.

  // ─── Aceable ────────────────────────────────────────
  {
    schoolSlug: "aceable",
    state: "CA",
    url: "https://www.aceable.com/traffic-school/california/",
    method: "dom",
    selector: null,
    notes: "CA traffic school pricing page",
  },
  {
    schoolSlug: "aceable",
    state: "TX",
    url: "https://www.aceable.com/defensive-driving/texas/",
    method: "dom",
    selector: null,
    notes: "TX defensive driving",
  },
  {
    schoolSlug: "aceable",
    state: "FL",
    // FL BDI = Aceable's "Florida Driver Improvement Course". The old
    // /traffic-school/florida/ URL is 404, and /drivers-ed/florida/ is teen
    // drivers-ed (wrong product). This is the correct BDI page. It shows a
    // fake-urgency "Regular $34.95 / Sale Price $5.94" banner — the extractor
    // now prefers the Regular figure.
    url: "https://www.aceable.com/defensive-driving/florida/",
    method: "dom",
    selector: null,
    notes: "FL Driver Improvement (BDI). Regular ~$34.95; ignore the sale-countdown $5.94.",
  },

  // ─── DriversEd.com ──────────────────────────────────
  {
    // NOTE: all three driversed URLs below currently return HTTP 404 (site
    // restructured its URL scheme) — the scraper flags them as "Dead URL".
    // They need updating to DriversEd's current pricing pages; low priority
    // while DriversEd has no monetizable affiliate link (WS3).
    schoolSlug: "driversed",
    state: "CA",
    url: "https://www.driversed.com/traffic-school/california/",
    method: "dom",
    selector: null,
    notes: "CA pricing — typically $29.99",
  },
  {
    schoolSlug: "driversed",
    state: "TX",
    url: "https://www.driversed.com/defensive-driving/texas/",
    method: "dom",
    selector: null,
  },
  {
    schoolSlug: "driversed",
    state: "FL",
    url: "https://www.driversed.com/traffic-school/florida/",
    method: "dom",
    selector: null,
  },

  // ─── $5 Dollar Traffic School ───────────────────────
  {
    schoolSlug: "5dollartrafficschool",
    state: "CA",
    url: "https://www.5dollartrafficschool.com",
    method: "fixed",
    fixedPrice: 5,
    notes: "Always $5 — CA DMV licensed since 1998, price is their brand",
  },
  {
    schoolSlug: "5dollartrafficschool",
    state: "FL",
    url: "https://www.5dollartrafficschool.com",
    method: "fixed",
    fixedPrice: 5,
    notes: "Always $5 — FL version",
  },

  // ─── Improv ─────────────────────────────────────────
  {
    schoolSlug: "improv",
    state: "CA",
    url: "https://www.myimprov.com/traffic-school/california/",
    method: "dom",
    selector: null,
    notes: "CA pricing — typically $22.95",
  },
  {
    schoolSlug: "improv",
    state: "FL",
    url: "https://www.myimprov.com/traffic-school/florida/",
    method: "dom",
    selector: null,
  },
  {
    schoolSlug: "improv",
    state: "TX",
    url: "https://www.myimprov.com/defensive-driving/texas/",
    method: "dom",
    selector: null,
  },

  // ─── TicketSchool ────────────────────────────────────
  {
    schoolSlug: "ticketschool",
    state: "FL",
    url: "https://www.ticketschool.com/florida/",
    method: "dom",
    selector: null,
    notes: "FL BDI — typically $19.95",
  },
  {
    schoolSlug: "ticketschool",
    state: "TX",
    url: "https://www.ticketschool.com/texas/",
    method: "dom",
    selector: null,
  },
  {
    schoolSlug: "ticketschool",
    state: "CA",
    url: "https://www.ticketschool.com/california/",
    method: "dom",
    selector: null,
  },
];
