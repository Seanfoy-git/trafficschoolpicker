import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import type {
  School,
  SchoolWithPrice,
  DirectorySchool,
  StateInfo,
  OnlineStatus,
} from "./types";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const SCHOOLS_DB = process.env.NOTION_SCHOOLS_DB;
const DIRECTORY_DB = process.env.NOTION_DIRECTORY_DB;
const STATES_DB = process.env.NOTION_STATES_DB;
const PRICING_DB = process.env.NOTION_PRICING_DB;

// ─── HELPERS ────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */

function getText(page: PageObjectResponse, field: string): string {
  const prop = (page.properties as any)[field];
  if (!prop) return "";
  if (prop.type === "rich_text") return prop.rich_text?.[0]?.plain_text ?? "";
  if (prop.type === "title") return prop.title?.[0]?.plain_text ?? "";
  if (prop.type === "url") return prop.url ?? "";
  if (prop.type === "phone_number") return prop.phone_number ?? "";
  return "";
}

function getNumber(page: PageObjectResponse, field: string): number | null {
  const prop = (page.properties as any)[field];
  return prop?.number ?? null;
}

function getSelect(page: PageObjectResponse, field: string): string | null {
  const prop = (page.properties as any)[field];
  return prop?.select?.name ?? null;
}

function getCheckbox(page: PageObjectResponse, field: string): boolean {
  const prop = (page.properties as any)[field];
  return prop?.checkbox ?? false;
}

function getDate(page: PageObjectResponse, field: string): string | null {
  const prop = (page.properties as any)[field];
  return prop?.date?.start ?? null;
}

function getRelationIds(page: PageObjectResponse, field: string): string[] {
  const prop = (page.properties as any)[field];
  if (prop?.type !== "relation") return [];
  return (prop.relation ?? []).map((r: any) => r.id);
}

function parseStateCodes(raw: string): string[] {
  if (!raw || raw.trim() === "") return [];
  if (raw.trim().toLowerCase() === "all") return ["all"];
  return raw.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
}

function parseLines(raw: string): string[] {
  return raw.split("\n").map((s) => s.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
}

function parseTrendSelect(raw: string | null): "up" | "down" | "stable" {
  if (!raw) return "stable";
  if (raw.startsWith("↑")) return "up";
  if (raw.startsWith("↓")) return "down";
  return "stable";
}

async function queryAllPages(
  databaseId: string,
  filter?: any,
  sorts?: any[]
): Promise<PageObjectResponse[]> {
  const results: PageObjectResponse[] = [];
  let cursor: string | undefined;
  do {
    const params: any = { database_id: databaseId, page_size: 100, start_cursor: cursor };
    if (filter) params.filter = filter;
    if (sorts) params.sorts = sorts;
    const response: any = await notion.databases.query(params);
    results.push(...(response.results as PageObjectResponse[]));
    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);
  return results;
}

// ─── STATES DB ──────────────────────────────────────────────

function deriveOnlineStatus(
  onlineAllowed: boolean,
  dismissesTicket: boolean,
  insuranceDiscount: boolean
): OnlineStatus {
  if (onlineAllowed && dismissesTicket) return "Online — ticket dismissal";
  if (onlineAllowed && insuranceDiscount) return "Online — insurance discount only";
  if (!onlineAllowed) return "In-person only";
  return "Unknown";
}

export async function getStateInfo(stateCode: string): Promise<StateInfo | null> {
  if (!process.env.NOTION_TOKEN || !STATES_DB) return null;
  try {
    const response = await notion.databases.query({
      database_id: STATES_DB,
      filter: {
        property: "Abbreviation",
        rich_text: { equals: stateCode.toUpperCase() },
      },
      page_size: 1,
    });
    if (!response.results.length) return null;
    const page = response.results[0] as PageObjectResponse;

    const onlineAllowed = getCheckbox(page, "Online Allowed");
    const dismissesTicket = getCheckbox(page, "Online Dismisses Ticket");
    const insuranceDiscount = getCheckbox(page, "Insurance Discount Available");

    return {
      id: page.id,
      code: getText(page, "Abbreviation"),
      name: getText(page, "State Name"),
      onlineAllowed,
      onlineDismissesTicket: dismissesTicket,
      insuranceDiscountAvailable: insuranceDiscount,
      onlineStatus: deriveOnlineStatus(onlineAllowed, dismissesTicket, insuranceDiscount),
      dmvUrl: getText(page, "DMV URL"),
      notes: getText(page, "Research Notes"),
      eligibility: getText(page, "Eligibility Requirements"),
      courtNotes: getText(page, "Court Acceptance Notes"),
      certificateSubmission: getSelect(page, "Certificate Submission"),
      minHours: getNumber(page, "Minimum Hours"),
      status: getSelect(page, "Status") ?? "Not Started",
    };
  } catch {
    return null;
  }
}

// ─── SCHOOLS (Traffic Schools DB) ───────────────────────────

function buildPlatformRatings(page: PageObjectResponse): import("./types").PlatformRating[] {
  const ratings: import("./types").PlatformRating[] = [];

  // Trustpilot
  const tpRating = getNumber(page, "Rating");
  const tpCount = getNumber(page, "Review Count");
  if (tpRating !== null) {
    ratings.push({
      platform: "Trustpilot",
      rating: tpRating,
      reviewCount: tpCount ?? 0,
      previousRating: getNumber(page, "Previous Rating"),
      trend: parseTrendSelect(getSelect(page, "Trustpilot Trend")),
      url: getText(page, "Review URL") || null,
    });
  }

  // Google (only if confidence is not "Wrong match")
  const gConfidence = getSelect(page, "Google Place Confidence");
  if (gConfidence !== "Wrong match") {
    const gRating = getNumber(page, "Google Rating");
    const gCount = getNumber(page, "Google Review Count");
    if (gRating !== null) {
      ratings.push({
        platform: "Google",
        rating: gRating,
        reviewCount: gCount ?? 0,
        previousRating: getNumber(page, "Google Previous Rating"),
        trend: parseTrendSelect(getSelect(page, "Google Trend")),
        url: getText(page, "Google URL") || null,
      });
    }
  }

  // App Store
  const asRating = getNumber(page, "App Store Rating");
  const asCount = getNumber(page, "App Store Review Count");
  if (asRating !== null) {
    ratings.push({
      platform: "App Store",
      rating: asRating,
      reviewCount: asCount ?? 0,
      previousRating: getNumber(page, "App Store Previous Rating"),
      trend: parseTrendSelect(getSelect(page, "App Store Trend")),
      url: getText(page, "App Store URL") || null,
    });
  }

  // Play Store
  const psRating = getNumber(page, "Play Store Rating");
  const psCount = getNumber(page, "Play Store Review Count");
  if (psRating !== null) {
    ratings.push({
      platform: "Play Store",
      rating: psRating,
      reviewCount: psCount ?? 0,
      previousRating: getNumber(page, "Play Store Previous Rating"),
      trend: parseTrendSelect(getSelect(page, "Play Store Trend")),
      url: getText(page, "Play Store URL") || null,
    });
  }

  return ratings;
}

function buildBBB(page: PageObjectResponse): import("./types").BBBRating | null {
  const grade = getSelect(page, "BBB Grade");
  if (!grade || grade === "NR") return null;
  return { grade, url: getText(page, "BBB URL") || null };
}

function mapSchool(page: PageObjectResponse): School {
  const tierRaw = getSelect(page, "Tier") ?? "";
  const tier: 1 | 2 = tierRaw === "1 - Featured" ? 1 : 2;

  return {
    id: page.id,
    slug:
      getText(page, "Slug") ||
      getText(page, "School Name").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    name: getText(page, "School Name"),
    tier,
    badge: getSelect(page, "Badge") as School["badge"],
    tagline: getText(page, "One Liner"),
    website: getText(page, "Website"),
    affiliateUrl: getText(page, "Affiliate URL"),
    affiliateNetwork: getSelect(page, "Affiliate Network") as School["affiliateNetwork"],
    commissionRate: getText(page, "Commission Rate"),
    rating: getNumber(page, "Rating"),
    reviewCount: getNumber(page, "Review Count"),
    reviewSource: getSelect(page, "Review Source") as School["reviewSource"],
    reviewUrl: getText(page, "Review URL") || null,
    ratings: buildPlatformRatings(page),
    bbb: buildBBB(page),
    synthesizedGood: getText(page, "Review Highlights Good"),
    synthesizedBad: getText(page, "Review Highlights Bad"),
    stateCodes: parseStateCodes(getText(page, "State Codes")),
    pros: parseLines(getText(page, "Pros")),
    cons: parseLines(getText(page, "Cons")),
    bestFor: getText(page, "Best For"),
    completionHours: getNumber(page, "Completion Time (hrs)"),
    mobileApp: getCheckbox(page, "Mobile App"),
    moneyBackGuarantee: getCheckbox(page, "Money Back Guarantee"),
    certificateDelivery: getSelect(page, "Certificate Delivery") as School["certificateDelivery"],
    courtAcceptance: getSelect(page, "Court Acceptance") as School["courtAcceptance"],
    founded: getNumber(page, "Founded"),
    showOnSite: getCheckbox(page, "Show On Site"),
    lastVerified: getDate(page, "Last Verified"),
  };
}

export async function getAllSchools(): Promise<School[]> {
  if (!process.env.NOTION_TOKEN || !SCHOOLS_DB) return [];
  try {
    const response = await notion.databases.query({
      database_id: SCHOOLS_DB,
      filter: {
        and: [
          { property: "Status", select: { equals: "Active" } },
          { property: "Show On Site", checkbox: { equals: true } },
        ],
      },
      sorts: [{ property: "Rating", direction: "descending" }],
    });
    return (response.results as PageObjectResponse[]).map(mapSchool);
  } catch {
    return [];
  }
}

export async function getSchoolBySlug(slug: string): Promise<School | null> {
  const all = await getAllSchools();
  return all.find((s) => s.slug === slug) ?? null;
}

// ─── SCHOOL PRICING DB ──────────────────────────────────────

export async function getSchoolPricingForState(
  stateCode: string
): Promise<SchoolWithPrice[]> {
  if (!process.env.NOTION_TOKEN || !SCHOOLS_DB) return [];

  // Get all active schools first (single API call)
  const schools = await getAllSchools();
  if (schools.length === 0) return [];

  // If Pricing DB exists, query it for state-specific prices
  let pricingMap = new Map<string, {
    price: number | null;
    originalPrice: number | null;
    affiliateUrl: string;
    priceNote: string;
    approved: boolean;
  }>();

  if (PRICING_DB) {
    try {
      const pricingPages = await queryAllPages(PRICING_DB, {
        and: [
          { property: "State Code", rich_text: { equals: stateCode.toUpperCase() } },
          { property: "Approved", checkbox: { equals: true } },
        ],
      });

      for (const pp of pricingPages) {
        // Get the school ID from the relation
        const schoolIds = getRelationIds(pp, "School");
        const schoolId = schoolIds[0];
        if (!schoolId) continue;

        pricingMap.set(schoolId, {
          price: getNumber(pp, "Price"),
          originalPrice: getNumber(pp, "Original Price"),
          affiliateUrl: getText(pp, "Affiliate URL"),
          priceNote: getText(pp, "Price Note"),
          approved: true,
        });
      }
    } catch {
      // Pricing DB may not exist yet — fall back to schools without prices
    }
  }

  // Merge schools with their state-specific pricing
  const results: SchoolWithPrice[] = [];
  for (const school of schools) {
    // Check if school serves this state
    const servesState =
      school.stateCodes.includes("all") ||
      school.stateCodes.includes(stateCode.toUpperCase());
    if (!servesState) continue;

    const pricing = pricingMap.get(school.id);

    results.push({
      ...school,
      price: pricing?.price ?? null,
      originalPrice: pricing?.originalPrice ?? null,
      stateAffiliateUrl: pricing?.affiliateUrl || null,
      priceNote: pricing?.priceNote || null,
    });
  }

  // Sort: Tier 1 first, then by price (nulls at end)
  return results.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    if (a.price === null && b.price === null) return 0;
    if (a.price === null) return 1;
    if (b.price === null) return -1;
    return a.price - b.price;
  });
}

// ─── DIRECTORY (School Directory DB) ────────────────────────

function mapDirectorySchool(page: PageObjectResponse): DirectorySchool {
  return {
    id: page.id,
    name: getText(page, "School Name"),
    state: getSelect(page, "State") || getText(page, "State") || "",
    licenseNumber: getText(page, "License Number"),
    phone: getText(page, "Phone"),
    address: getText(page, "Address"),
    website: getText(page, "Website") || null,
    onlineAvailable: getCheckbox(page, "Online Available"),
    source: getSelect(page, "Source") || getText(page, "Source") || "State DMV",
    lastScraped: getDate(page, "Date Scraped"),
  };
}

export async function getDirectoryForState(
  stateName: string
): Promise<DirectorySchool[]> {
  if (!process.env.NOTION_TOKEN || !DIRECTORY_DB) return [];
  try {
    const pages = await queryAllPages(
      DIRECTORY_DB,
      { property: "State", select: { equals: stateName } },
      [{ property: "School Name", direction: "ascending" }]
    );
    return pages.map(mapDirectorySchool);
  } catch {
    return [];
  }
}

// ─── PRICE HELPER ───────────────────────────────────────────

export function getEffectiveAffiliateUrl(school: SchoolWithPrice): string {
  return school.stateAffiliateUrl || school.affiliateUrl || school.website;
}

export function getPriceDisplay(
  school: SchoolWithPrice
): { amount: number | null; display: string } {
  return {
    amount: school.price,
    display: school.price !== null ? `$${school.price.toFixed(2)}` : "Check website",
  };
}

// ─── ADMIN STATS ────────────────────────────────────────────

export async function getAdminStats() {
  const envChecks = {
    notionToken: !!process.env.NOTION_TOKEN,
    schoolsDb: !!SCHOOLS_DB,
    directoryDb: !!DIRECTORY_DB,
    statesDb: !!STATES_DB,
    pricingDb: !!PRICING_DB,
    deployHook: !!process.env.VERCEL_DEPLOY_HOOK,
  };

  if (!process.env.NOTION_TOKEN) {
    return {
      totalSchools: 0, tier1Count: 0, tier2Count: 0,
      noAffiliateCount: 0, noAffiliateSchools: [] as string[],
      caDirectoryCount: 0, txDirectoryCount: 0, flDirectoryCount: 0,
      latestVerified: null as string | null,
      envChecks,
    };
  }

  const schools = await getAllSchools();
  const tier1 = schools.filter((s) => s.tier === 1);
  const tier2 = schools.filter((s) => s.tier === 2);
  const noAffiliate = schools.filter((s) => !s.affiliateUrl);
  const latestVerified = schools.map((s) => s.lastVerified).filter(Boolean).sort().pop();

  let caCount = 0, txCount = 0, flCount = 0;
  try {
    const [ca, tx, fl] = await Promise.all([
      getDirectoryForState("California"),
      getDirectoryForState("Texas"),
      getDirectoryForState("Florida"),
    ]);
    caCount = ca.length; txCount = tx.length; flCount = fl.length;
  } catch { /* */ }

  return {
    totalSchools: schools.length,
    tier1Count: tier1.length,
    tier2Count: tier2.length,
    noAffiliateCount: noAffiliate.length,
    noAffiliateSchools: noAffiliate.map((s) => s.name),
    caDirectoryCount: caCount,
    txDirectoryCount: txCount,
    flDirectoryCount: flCount,
    latestVerified: latestVerified ?? null,
    envChecks,
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */
