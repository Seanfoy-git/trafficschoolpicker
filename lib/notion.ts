import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import type { School, DirectorySchool, StateInfo } from "./types";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

function isConfigured(): boolean {
  return !!(process.env.NOTION_TOKEN && process.env.NOTION_SCHOOLS_DB);
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

/* eslint-enable @typescript-eslint/no-explicit-any */

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

// ─── SCHOOLS ────────────────────────────────────────────────

function mapSchool(page: PageObjectResponse): School {
  return {
    id: page.id,
    slug:
      getText(page, "Slug") ||
      getText(page, "School Name")
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, ""),
    name: getText(page, "School Name"),
    tier: (getNumber(page, "Tier") ??
      (getSelect(page, "Tier") === "1 - Featured" ? 1 : 2)) as 1 | 2,
    badge: getSelect(page, "Badge") as School["badge"],
    tagline: getText(page, "One Liner"),
    website: getText(page, "Website"),
    affiliateUrl: getText(page, "Affiliate URL"),
    affiliateNetwork: getSelect(
      page,
      "Affiliate Network"
    ) as School["affiliateNetwork"],
    commissionRate: getText(page, "Commission Rate"),
    price: getNumber(page, "Price") ?? 0,
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
    certificateDelivery: getSelect(
      page,
      "Certificate Delivery"
    ) as School["certificateDelivery"],
    courtAcceptance: getSelect(
      page,
      "Court Acceptance"
    ) as School["courtAcceptance"],
    founded: getNumber(page, "Founded"),
    showOnSite: getCheckbox(page, "Show On Site"),
    lastVerified: getDate(page, "Last Verified"),
  };
}

export async function getAllSchools(): Promise<School[]> {
  if (!isConfigured()) return [];
  const response = await notion.databases.query({
    database_id: process.env.NOTION_SCHOOLS_DB!,
    filter: {
      and: [
        { property: "Status", select: { equals: "Active" } },
        { property: "Show On Site", checkbox: { equals: true } },
      ],
    },
    sorts: [{ property: "Rating", direction: "descending" }],
  });
  return (response.results as PageObjectResponse[]).map(mapSchool);
}

export async function getSchoolsForState(
  stateCode: string
): Promise<School[]> {
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

// ─── DIRECTORY ──────────────────────────────────────────────

function mapDirectorySchool(page: PageObjectResponse): DirectorySchool {
  return {
    id: page.id,
    name: getText(page, "School Name"),
    state: getText(page, "State") || getSelect(page, "State") || "",
    licenseNumber: getText(page, "License Number"),
    phone: getText(page, "Phone"),
    address:
      getText(page, "Counties Approved") || getText(page, "Address") || "",
    website: getText(page, "Website") || null,
    onlineAvailable: getCheckbox(page, "Online Available"),
    tier: 3,
    source:
      getText(page, "Source") || getSelect(page, "Source") || "State DMV",
    lastScraped: getDate(page, "Date Scraped"),
  };
}

export async function getDirectoryForState(
  stateName: string
): Promise<DirectorySchool[]> {
  if (!isConfigured() || !process.env.NOTION_DIRECTORY_DB) return [];
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DIRECTORY_DB!,
      filter: {
        property: "State",
        select: { equals: stateName },
      },
      sorts: [{ property: "School Name", direction: "ascending" }],
      page_size: 100,
    });
    return (response.results as PageObjectResponse[]).map(mapDirectorySchool);
  } catch {
    return [];
  }
}

// ─── STATES ─────────────────────────────────────────────────

function mapState(page: PageObjectResponse): StateInfo {
  return {
    id: page.id,
    code:
      getText(page, "State Code") || getText(page, "Abbreviation") || "",
    name: getText(page, "State Name") || getText(page, "Name") || "",
    onlineAllowed:
      getCheckbox(page, "Online Allowed") ||
      getCheckbox(page, "Online Available"),
    minHours:
      getNumber(page, "Min Hours") || getNumber(page, "Minimum Hours"),
    programName:
      getText(page, "Program Name") ||
      getText(page, "TVS Name") ||
      "Traffic School",
    eligibilityNotes:
      getText(page, "Eligibility") ||
      getText(page, "Eligibility Notes") ||
      "",
    courtProcess:
      getText(page, "Court Process") || getText(page, "How It Works") || "",
    dmvUrl:
      getText(page, "DMV URL") || getText(page, "Official URL") || "",
    lastUpdated:
      getDate(page, "Last Updated") || getDate(page, "Last Verified"),
  };
}

export async function getStateInfo(
  stateCode: string
): Promise<StateInfo | null> {
  if (!isConfigured() || !process.env.NOTION_STATES_DB) return null;
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_STATES_DB!,
      filter: {
        or: [
          {
            property: "State Code",
            rich_text: { equals: stateCode.toUpperCase() },
          },
          {
            property: "Abbreviation",
            rich_text: { equals: stateCode.toUpperCase() },
          },
        ],
      },
      page_size: 1,
    });
    if (!response.results.length) return null;
    return mapState(response.results[0] as PageObjectResponse);
  } catch {
    return null;
  }
}

export async function getAllStates(): Promise<StateInfo[]> {
  if (!isConfigured() || !process.env.NOTION_STATES_DB) return [];
  const response = await notion.databases.query({
    database_id: process.env.NOTION_STATES_DB!,
    sorts: [{ property: "State Name", direction: "ascending" }],
    page_size: 100,
  });
  return (response.results as PageObjectResponse[]).map(mapState);
}

// ─── ADMIN STATS ────────────────────────────────────────────

export async function getAdminStats() {
  if (!isConfigured()) {
    return {
      totalSchools: 0, tier1Count: 0, tier2Count: 0,
      noAffiliateCount: 0, noAffiliateSchools: [] as string[],
      caDirectoryCount: 0, txDirectoryCount: 0, flDirectoryCount: 0,
      latestVerified: null as string | null,
      envChecks: {
        notionToken: !!process.env.NOTION_TOKEN,
        schoolsDb: !!process.env.NOTION_SCHOOLS_DB,
        directoryDb: !!process.env.NOTION_DIRECTORY_DB,
        statesDb: !!process.env.NOTION_STATES_DB,
        deployHook: !!process.env.VERCEL_DEPLOY_HOOK,
      },
    };
  }
  const allResponse = await notion.databases.query({
    database_id: process.env.NOTION_SCHOOLS_DB!,
    filter: {
      property: "Show On Site",
      checkbox: { equals: true },
    },
  });

  const schools = (allResponse.results as PageObjectResponse[]).map(mapSchool);
  const tier1 = schools.filter((s) => s.tier === 1);
  const tier2 = schools.filter((s) => s.tier === 2);
  const noAffiliate = schools.filter((s) => !s.affiliateUrl);
  const latestVerified = schools
    .map((s) => s.lastVerified)
    .filter(Boolean)
    .sort()
    .pop();

  let caDirectoryCount = 0;
  let txDirectoryCount = 0;
  let flDirectoryCount = 0;
  try {
    const [ca, tx, fl] = await Promise.all([
      getDirectoryForState("California"),
      getDirectoryForState("Texas"),
      getDirectoryForState("Florida"),
    ]);
    caDirectoryCount = ca.length;
    txDirectoryCount = tx.length;
    flDirectoryCount = fl.length;
  } catch {
    // Directory DB may not exist yet
  }

  return {
    totalSchools: schools.length,
    tier1Count: tier1.length,
    tier2Count: tier2.length,
    noAffiliateCount: noAffiliate.length,
    noAffiliateSchools: noAffiliate.map((s) => s.name),
    caDirectoryCount,
    txDirectoryCount,
    flDirectoryCount,
    latestVerified: latestVerified ?? null,
    envChecks: {
      notionToken: !!process.env.NOTION_TOKEN,
      schoolsDb: !!process.env.NOTION_SCHOOLS_DB,
      directoryDb: !!process.env.NOTION_DIRECTORY_DB,
      statesDb: !!process.env.NOTION_STATES_DB,
      deployHook: !!process.env.VERCEL_DEPLOY_HOOK,
    },
  };
}
