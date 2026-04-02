import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import type { School, DirectorySchool, StateInfo } from "./types";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const SCHOOLS_DB = process.env.NOTION_SCHOOLS_DB; // Traffic Schools (Tier 1/2 curated)
const DIRECTORY_DB = process.env.NOTION_DIRECTORY_DB; // School Directory (DMV-scraped)

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

// ─── SCHOOLS (Traffic Schools DB) ───────────────────────────

function mapSchool(page: PageObjectResponse): School {
  // Tier: "1 - Featured" → 1, anything else (including null) → 2
  const tier: 1 | 2 = getSelect(page, "Tier") === "1 - Featured" ? 1 : 2;

  return {
    id: page.id,
    slug:
      getText(page, "Slug") ||
      getText(page, "School Name")
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, ""),
    name: getText(page, "School Name"),
    tier,
    badge: getSelect(page, "Badge") as School["badge"],
    tagline: getText(page, "One Liner"),
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

export async function getSchoolsForState(stateCode: string): Promise<School[]> {
  const all = await getAllSchools();
  return all
    .filter((school) => {
      if (school.stateCodes.includes("all")) return true;
      return school.stateCodes.includes(stateCode.toUpperCase());
    })
    .sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier;
      return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
    });
}

export async function getSchoolBySlug(slug: string): Promise<School | null> {
  const all = await getAllSchools();
  return all.find((s) => s.slug === slug) ?? null;
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

async function queryAllPages(
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

// ─── STATES (no separate DB yet — use static fallback) ──────

export async function getStateInfo(
  _stateCode: string
): Promise<StateInfo | null> {
  if (!process.env.NOTION_STATES_DB) return null;
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
      onlineAllowed: getCheckbox(page, "Online Allowed"),
      minHours: getNumber(page, "Min Hours"),
      programName: getText(page, "Program Name") || "Traffic School",
      eligibilityNotes: getText(page, "Eligibility") || "",
      courtProcess: getText(page, "Court Process") || "",
      dmvUrl: getText(page, "DMV URL") || "",
      lastUpdated: getDate(page, "Last Updated"),
    };
  } catch {
    return null;
  }
}

export async function getAllStates(): Promise<StateInfo[]> {
  return []; // Use static STATE_LIST from state-utils.ts
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

// ─── ADMIN STATS ────────────────────────────────────────────

export async function getAdminStats() {
  const envChecks = {
    notionToken: !!process.env.NOTION_TOKEN,
    schoolsDb: !!SCHOOLS_DB,
    directoryDb: !!DIRECTORY_DB,
    statesDb: !!process.env.NOTION_STATES_DB,
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
  const latestVerified = schools
    .map((s) => s.lastVerified)
    .filter(Boolean)
    .sort()
    .pop();

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
