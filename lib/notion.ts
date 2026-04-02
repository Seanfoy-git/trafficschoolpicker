import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import type { School, DirectorySchool, StateInfo } from "./types";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

// Single database for everything — Schools DB and Directory DB are the same
const DB_ID = process.env.NOTION_SCHOOLS_DB || process.env.NOTION_DIRECTORY_DB;

function isConfigured(): boolean {
  return !!(process.env.NOTION_TOKEN && DB_ID);
}

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

// Map Notion Tier select values → numeric tier
// "Tier 1 - Fully Reviewed" → 1, "Tier 2 - Listed" → 2, anything else → 3
function parseTier(page: PageObjectResponse): 1 | 2 | 3 {
  const raw = getSelect(page, "Tier") ?? "";
  if (raw.startsWith("Tier 1")) return 1;
  if (raw.startsWith("Tier 2")) return 2;
  return 3;
}

function parseStateCodes(raw: string): string[] {
  if (!raw || raw.trim() === "") return [];
  if (raw.trim().toLowerCase() === "all") return ["all"];
  return raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

function parseLines(raw: string): string[] {
  return raw
    .split("\n")
    .map((s) => s.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
}

// ─── UNIFIED RECORD MAPPER ─────────────────────────────────

function mapSchool(page: PageObjectResponse): School {
  const tier = parseTier(page);
  const stateSel = getSelect(page, "State") ?? "";
  // State can be a select (e.g. "California") or a text field with codes
  const stateCodes = parseStateCodes(getText(page, "State Codes"));

  return {
    id: page.id,
    slug:
      getText(page, "Slug") ||
      getText(page, "School Name")
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, ""),
    name: getText(page, "School Name"),
    tier: tier === 3 ? 2 : tier, // For School type, force to 1|2
    badge: getSelect(page, "Badge") as School["badge"],
    tagline: getText(page, "One Liner") || getText(page, "Notes"),
    website: getText(page, "Website"),
    affiliateUrl: getText(page, "Affiliate URL"),
    affiliateNetwork: getSelect(page, "Affiliate Network") as School["affiliateNetwork"],
    commissionRate: getText(page, "Commission Rate"),
    price: getNumber(page, "Price CA") ?? getNumber(page, "Price") ?? 0,
    priceCA: getNumber(page, "Price CA"),
    priceTX: getNumber(page, "Price TX"),
    priceFL: getNumber(page, "Price FL"),
    priceNY: getNumber(page, "Price NY"),
    originalPrice: getNumber(page, "Original Price"),
    rating: getNumber(page, "Rating"),
    reviewCount: getNumber(page, "Review Count"),
    reviewSource: getSelect(page, "Review Source") as School["reviewSource"],
    reviewUrl: getText(page, "Review URL") || null,
    stateCodes: stateCodes.length > 0 ? stateCodes : stateSel ? [stateSel] : [],
    pros: parseLines(getText(page, "Pros")),
    cons: parseLines(getText(page, "Cons")),
    bestFor: getText(page, "Best For"),
    completionHours: getNumber(page, "Completion Time (hrs)"),
    mobileApp: getCheckbox(page, "Mobile App"),
    moneyBackGuarantee: getCheckbox(page, "Money Back Guarantee"),
    certificateDelivery: getSelect(page, "Certificate Delivery") as School["certificateDelivery"],
    courtAcceptance: getSelect(page, "Court Acceptance") as School["courtAcceptance"],
    founded: getNumber(page, "Founded"),
    showOnSite: true,
    lastVerified: getDate(page, "Last Verified") || getDate(page, "Date Scraped"),
  };
}

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
    tier: 3,
    source: getSelect(page, "Source") || getText(page, "Source") || "State DMV",
    lastScraped: getDate(page, "Date Scraped"),
  };
}

// ─── QUERIES ────────────────────────────────────────────────

// Paginate through all results for a query
async function queryAll(
  databaseId: string,
  filter: any,
  sorts?: any[]
): Promise<PageObjectResponse[]> {
  const results: PageObjectResponse[] = [];
  let cursor: string | undefined;

  do {
    const response: any = await notion.databases.query({
      database_id: databaseId,
      filter,
      sorts,
      start_cursor: cursor,
      page_size: 100,
    });
    results.push(...(response.results as PageObjectResponse[]));
    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);

  return results;
}

/** Get Tier 1 and Tier 2 schools (curated, reviewed). */
export async function getAllSchools(): Promise<School[]> {
  if (!isConfigured()) return [];
  try {
    const pages = await queryAll(DB_ID!, {
      or: [
        { property: "Tier", select: { equals: "Tier 1 - Fully Reviewed" } },
        { property: "Tier", select: { equals: "Tier 2 - Listed" } },
      ],
    });
    return pages.map(mapSchool).sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier;
      return (b.rating ?? 0) - (a.rating ?? 0);
    });
  } catch {
    return [];
  }
}

/** Get Tier 1/2 schools that serve a given state. */
export async function getSchoolsForState(stateCode: string): Promise<School[]> {
  const all = await getAllSchools();
  return all.filter((school) => {
    if (school.stateCodes.includes("all")) return true;
    // Match by state code (e.g. "CA") or full state name (e.g. "California")
    return school.stateCodes.some(
      (sc) =>
        sc.toUpperCase() === stateCode.toUpperCase() ||
        sc.toLowerCase() === stateCode.toLowerCase()
    );
  });
}

/** Get a single school by slug (Tier 1/2 only). */
export async function getSchoolBySlug(slug: string): Promise<School | null> {
  const all = await getAllSchools();
  return all.find((s) => s.slug === slug) ?? null;
}

/** Get Tier 3 (directory) schools for a state. */
export async function getDirectoryForState(
  stateName: string
): Promise<DirectorySchool[]> {
  if (!isConfigured()) return [];
  try {
    // Get all schools for the state that are NOT tier 1/2
    const pages = await queryAll(
      DB_ID!,
      {
        and: [
          { property: "State", select: { equals: stateName } },
          {
            or: [
              { property: "Tier", select: { equals: "Tier 3 - Directory Only" } },
              { property: "Tier", select: { is_empty: true } },
            ],
          },
        ],
      },
      [{ property: "School Name", direction: "ascending" }]
    );
    return pages.map(mapDirectorySchool);
  } catch {
    return [];
  }
}

// ─── STATES (no separate DB — use static fallback) ─────────

export async function getStateInfo(
  _stateCode: string
): Promise<StateInfo | null> {
  // States DB not yet created — return null to use static fallback
  if (!process.env.NOTION_STATES_DB) return null;
  if (!isConfigured()) return null;
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_STATES_DB,
      filter: {
        or: [
          { property: "State Code", rich_text: { equals: _stateCode.toUpperCase() } },
          { property: "Abbreviation", rich_text: { equals: _stateCode.toUpperCase() } },
        ],
      },
      page_size: 1,
    });
    if (!response.results.length) return null;
    const page = response.results[0] as PageObjectResponse;
    return {
      id: page.id,
      code: getText(page, "State Code") || getText(page, "Abbreviation") || "",
      name: getText(page, "State Name") || getText(page, "Name") || "",
      onlineAllowed: getCheckbox(page, "Online Allowed") || getCheckbox(page, "Online Available"),
      minHours: getNumber(page, "Min Hours") || getNumber(page, "Minimum Hours"),
      programName: getText(page, "Program Name") || getText(page, "TVS Name") || "Traffic School",
      eligibilityNotes: getText(page, "Eligibility") || getText(page, "Eligibility Notes") || "",
      courtProcess: getText(page, "Court Process") || getText(page, "How It Works") || "",
      dmvUrl: getText(page, "DMV URL") || getText(page, "Official URL") || "",
      lastUpdated: getDate(page, "Last Updated") || getDate(page, "Last Verified"),
    };
  } catch {
    return null;
  }
}

export async function getAllStates(): Promise<StateInfo[]> {
  return []; // Use static STATE_LIST from state-utils.ts for routing
}

// ─── ADMIN STATS ────────────────────────────────────────────

export async function getAdminStats() {
  const envChecks = {
    notionToken: !!process.env.NOTION_TOKEN,
    schoolsDb: !!DB_ID,
    directoryDb: !!DB_ID,
    statesDb: !!process.env.NOTION_STATES_DB,
    deployHook: !!process.env.VERCEL_DEPLOY_HOOK,
  };

  if (!isConfigured()) {
    return {
      totalSchools: 0, tier1Count: 0, tier2Count: 0, tier3Count: 0,
      noAffiliateCount: 0, noAffiliateSchools: [] as string[],
      caDirectoryCount: 0, txDirectoryCount: 0, flDirectoryCount: 0,
      latestVerified: null as string | null,
      envChecks,
    };
  }

  const tier1Schools = await getAllSchools();
  const tier1 = tier1Schools.filter((s) => s.tier === 1);
  const tier2 = tier1Schools.filter((s) => s.tier === 2);
  const noAffiliate = tier1Schools.filter((s) => !s.affiliateUrl);

  let caCount = 0, txCount = 0, flCount = 0;
  try {
    const [ca, tx, fl] = await Promise.all([
      getDirectoryForState("California"),
      getDirectoryForState("Texas"),
      getDirectoryForState("Florida"),
    ]);
    caCount = ca.length;
    txCount = tx.length;
    flCount = fl.length;
  } catch { /* */ }

  return {
    totalSchools: tier1Schools.length,
    tier1Count: tier1.length,
    tier2Count: tier2.length,
    tier3Count: caCount + txCount + flCount,
    noAffiliateCount: noAffiliate.length,
    noAffiliateSchools: noAffiliate.map((s) => s.name),
    caDirectoryCount: caCount,
    txDirectoryCount: txCount,
    flDirectoryCount: flCount,
    latestVerified: null as string | null,
    envChecks,
  };
}

// ─── PRICE HELPER ───────────────────────────────────────────

export function getPriceForState(
  school: School,
  stateCode: string
): { amount: number | null; display: string } {
  const stateMap: Record<string, number | null> = {
    CA: school.priceCA,
    TX: school.priceTX,
    FL: school.priceFL,
    NY: school.priceNY,
  };

  const amount = stateMap[stateCode.toUpperCase()] ?? (school.price || null);

  return {
    amount,
    display: amount !== null ? `$${amount.toFixed(2)}` : "Check website",
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */
