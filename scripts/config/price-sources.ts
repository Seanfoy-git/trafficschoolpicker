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
  // CA + FL targets removed: those states aren't in iDriveSafely's coverage
  // (no monetizable course there), so scraping them only re-creates junk
  // Pricing rows. WS2 will gate this properly off the offers list.
  {
    schoolSlug: "idrivesafely",
    state: "TX",
    url: "https://www.idrivesafely.com/defensive-driving/texas/",
    method: "dom",
    selector: null,
    notes: "TX defensive driving price",
  },
  {
    schoolSlug: "idrivesafely",
    state: "NY",
    url: "https://www.idrivesafely.com/defensive-driving/new-york/pirp/",
    method: "dom",
    selector: null,
    notes: "NY PIRP pricing",
  },

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
    url: "https://www.aceable.com/traffic-school/florida/",
    method: "dom",
    selector: null,
    notes: "FL BDI pricing",
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
