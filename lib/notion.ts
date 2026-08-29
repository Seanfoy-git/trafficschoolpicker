import { cache } from "react";
import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import type {
  School,
  SchoolWithPrice,
  DirectorySchool,
  StateInfo,
  OnlineStatus,
  StateRequirement,
  SchoolStateVariant,
  StateFaqEntry,
  ContentStatus,
  ReviewBlock,
  ReviewBlockType,
  ReviewRichText,
  QuestionPage,
  QuestionKeyFact,
  QuestionBody,
} from "./types";
import { pickCanonicalRow } from "./state-canonical";
import { STATE_LIST, type StateMeta } from "./state-utils";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const SCHOOLS_DB = process.env.NOTION_SCHOOLS_DB;
const DIRECTORY_DB = process.env.NOTION_DIRECTORY_DB;
const STATES_DB = process.env.NOTION_STATES_DB;
const PRICING_DB = process.env.NOTION_PRICING_DB;
const STATE_REQUIREMENTS_DB = process.env.NOTION_STATE_REQUIREMENTS_DB;
const SCHOOL_VARIANTS_DB = process.env.NOTION_SCHOOL_VARIANTS_DB;
const QUESTIONS_DB = process.env.NOTION_QUESTIONS_DB;

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

// Concatenates every rich_text segment so long paragraphs and JSON blobs
// aren't truncated at Notion's per-segment cap.
function getFullRichText(page: PageObjectResponse, field: string): string {
  const prop = (page.properties as any)[field];
  if (prop?.type !== "rich_text") return "";
  return (prop.rich_text ?? []).map((s: any) => s.plain_text ?? "").join("");
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

// ─── PAGE-SOURCE GUARDS (P0 incident, 2026-08-25) ───────────
// Any route that renders a Notion page BODY (blocks) by id is in the incident's
// risk class: an over-broad token + an API mis-serve could resolve that id to a
// foreign workspace page (recipe / Credentials Vault). Before rendering blocks we
// confirm the page's PARENT is the expected CMS database; otherwise fail closed.
const normId = (s: string | undefined | null) => (s ?? "").replace(/-/g, "").toLowerCase();
const pageParentDbId = (p: PageObjectResponse): string =>
  normId((p as any)?.parent?.database_id ?? (p as any)?.parent?.data_source_id ?? "");

// Retrieve a page and confirm its parent is one of `allowed` (normalized db/data-
// source ids). Returns false on any error or mismatch (fail-closed). Empty
// `allowed` (db env unset) → false, so nothing renders rather than risking a leak.
async function pageBelongsTo(pageId: string, allowed: Set<string>): Promise<boolean> {
  if (allowed.size === 0) return false;
  try {
    const page = await withNotionRetry(() => notion.pages.retrieve({ page_id: pageId }));
    return allowed.has(pageParentDbId(page as PageObjectResponse));
  } catch {
    return false;
  }
}
const SCHOOLS_PARENT_IDS = new Set([normId(SCHOOLS_DB)].filter(Boolean));

function parseLines(raw: string): string[] {
  // Split on newlines first; if that yields a single element with pipes, split on pipes
  const lines = raw.split("\n").map((s) => s.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
  if (lines.length === 1 && lines[0].includes("|")) {
    return lines[0].split("|").map((s) => s.trim()).filter(Boolean);
  }
  // Also handle multi-line where individual lines contain pipes
  return lines.flatMap((line) =>
    line.includes("|") ? line.split("|").map((s) => s.trim()).filter(Boolean) : [line]
  );
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

// Notion API error codes that are transient (retry), vs. a hard failure (throw).
const TRANSIENT_NOTION_CODES = new Set([
  "rate_limited",
  "internal_server_error",
  "service_unavailable",
  "gateway_timeout",
  "conflict_error",
]);

// Runs a Notion op with exponential backoff on transient errors, then rethrows.
// Use for critical page-content queries so a brief blip is retried and a genuine
// outage surfaces as a thrown error — never a silent empty result. See the note
// on getStateInfo for why swallowing these to null is dangerous.
async function withNotionRetry<T>(op: () => Promise<T>, attempts = 5): Promise<T> {
  let lastErr: unknown;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await op();
    } catch (err) {
      lastErr = err;
      const code = (err as { code?: string })?.code;
      if (i === attempts || !(code && TRANSIENT_NOTION_CODES.has(code))) throw err;
      await new Promise((r) => setTimeout(r, 500 * 2 ** (i - 1))); // 0.5s,1s,2s,4s
    }
  }
  throw lastErr; // unreachable — loop either returns or throws
}

// Fetch a table once per build worker and share it across every page render in
// that process. React cache() only dedupes within a SINGLE render, so without
// this each of the 51 state pages re-queried every table — on the order of ~700
// Notion requests per build, enough to trip the API rate limit. This collapses
// that to one fetch per table per worker.
//
// The process-level memo applies ONLY during `next build` (NEXT_PHASE is set to
// 'phase-production-build' before app modules load — see next/dist/build). At
// runtime it falls back to React cache() (per-render dedup) so ISR revalidation
// and dynamic routes like /admin always read fresh Notion data. And unlike
// unstable_cache, nothing persists across builds, so every deploy still reflects
// fresh Notion content (the "edit in Notion → redeploy" flow). The build memo is
// cleared on rejection so a transient failure can be retried by the next caller
// rather than poisoning the whole build.
function memoize<T>(fn: () => Promise<T>): () => Promise<T> {
  if (process.env.NEXT_PHASE !== "phase-production-build") {
    return cache(fn);
  }
  let inflight: Promise<T> | null = null;
  return () => {
    if (!inflight) {
      inflight = fn().catch((err) => {
        inflight = null;
        throw err;
      });
    }
    return inflight;
  };
}

// ─── STATES DB ──────────────────────────────────────────────

function deriveOnlineStatus(
  onlineAllowed: boolean,
  dismissesTicket: boolean,
  insuranceDiscount: boolean,
  onlineModel: string | null
): OnlineStatus {
  // "Online Model" is an explicit editorial override for states whose reality the
  // three checkboxes can't model honestly (court-by-court states). It wins when set:
  //  - "Court discretion": online courses exist but acceptance is decided court by
  //    court (no statewide program) — keeps the comparison cards, drops any
  //    statewide "ticket dismissal: yes" claim (KS, WY).
  //  - "Court program only": no self-serve online course resolves a ticket; relief
  //    runs through a court program (IL court supervision, KY State Traffic School).
  //    No cards — the national online courses don't satisfy that process.
  if (onlineModel === "Court discretion") return "Online — court discretion";
  if (onlineModel === "Court program only") return "Court program only";
  if (onlineAllowed && dismissesTicket) return "Online — ticket dismissal";
  if (onlineAllowed && insuranceDiscount) return "Online — insurance discount only";
  if (!onlineAllowed) return "In-person only";
  return "Unknown";
}

// Parses the State FAQ rich_text JSON blob.
// Canonical schema is [{"q":"…","a":"…"}, …] but {"question":"…","answer":"…"}
// is also accepted as an alias to avoid silent-fallthrough on a typo.
// On non-empty input that yields zero entries we log a warning so failures
// surface in Vercel logs instead of silently rendering the static fallback.
function parseStateFaqJson(raw: string, stateCodeForLog?: string): StateFaqEntry[] {
  if (!raw || !raw.trim()) return [];
  // Optional `faqjson:` prefix. The Notion editing connector rejects a property
  // value that parses as top-level JSON, so FAQ blobs edited through it are stored
  // as `faqjson:[…]`. Strip it here; legacy values are bare JSON and untouched.
  const body = raw.trim().replace(/^faqjson:\s*/i, "");
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch (err) {
    console.warn(
      `[State FAQ] JSON.parse failed for ${stateCodeForLog ?? "?"}: ${(err as Error).message} — falling back to legacy FAQs`
    );
    return [];
  }
  if (!Array.isArray(parsed)) {
    console.warn(`[State FAQ] expected array for ${stateCodeForLog ?? "?"}, got ${typeof parsed} — falling back`);
    return [];
  }
  const out: StateFaqEntry[] = [];
  for (const entry of parsed) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    const q = String(e.q ?? e.question ?? "").trim();
    const a = String(e.a ?? e.answer ?? "").trim();
    if (q && a) out.push({ q, a });
  }
  if (out.length === 0) {
    console.warn(
      `[State FAQ] non-empty blob for ${stateCodeForLog ?? "?"} parsed to 0 entries — check schema (expected [{"q":"…","a":"…"}, …])`
    );
  }
  return out;
}

function isContentStatus(value: string | null): value is ContentStatus {
  return value === "Complete" || value === "Partial" || value === "Stub";
}

function mapStateInfo(page: PageObjectResponse): StateInfo {
  const onlineAllowed = getCheckbox(page, "Online Allowed");
  const dismissesTicket = getCheckbox(page, "Online Dismisses Ticket");
  const insuranceDiscount = getCheckbox(page, "Insurance Discount Available");
  const contentStatusRaw = getSelect(page, "Content Status");

  return {
    id: page.id,
    code: getText(page, "Abbreviation"),
    name: getText(page, "State Name"),
    onlineAllowed,
    onlineDismissesTicket: dismissesTicket,
    insuranceDiscountAvailable: insuranceDiscount,
    onlineStatus: deriveOnlineStatus(onlineAllowed, dismissesTicket, insuranceDiscount, getSelect(page, "Online Model")),
    dmvUrl: getText(page, "DMV URL"),
    notes: getText(page, "Research Notes"),
    eligibility: getText(page, "Eligibility Requirements"),
    courtNotes: getText(page, "Court Acceptance Notes"),
    certificateSubmission: getSelect(page, "Certificate Submission"),
    minHours: getNumber(page, "Minimum Hours"),
    status: getSelect(page, "Status") ?? "Not Started",
    introParagraph: getFullRichText(page, "Intro Paragraph"),
    trueCostOfATicket: getFullRichText(page, "True Cost of a Ticket").trim() || null,
    stateFaq: parseStateFaqJson(getFullRichText(page, "State FAQ"), getText(page, "Abbreviation")),
    lastVerified: getDate(page, "Last Verified"),
    contentStatus: isContentStatus(contentStatusRaw) ? contentStatusRaw : null,
    approvalLabel: getText(page, "Approval Label") || null,
    noPartnerOffer: getCheckbox(page, "No Partner Offer"),
    // Course length: single source. courseHours is null unless Hours Source is
    // set, so an unsourced value can never render anywhere (Package 4).
    ...(() => {
      const hoursSource = getText(page, "Hours Source") || null;
      return {
        hoursSource,
        courseHours: hoursSource ? (getText(page, "Course Hours").trim() || null) : null,
        hoursVerified: getDate(page, "Hours Verified"),
      };
    })(),
  };
}

// One fetch of the entire States DB per build, resolved to the canonical
// StateInfo for each state code. The States DB still holds duplicate seed rows
// per state, so we group by abbreviation and run pickCanonicalRow per group —
// scoring by editorial richness so we never render the empty 04-02 seed row.
// See lib/state-canonical.ts.
//
// Deliberately NOT wrapped in a catch that returns an empty map: a missing
// StateInfo renders a content-less "status not confirmed" stub, so swallowing a
// transient Notion error would silently ship Complete states as blank pages
// (this is what blanked Washington DC when a build-time query got rate-limited).
// withNotionRetry retries transient failures, then lets them propagate — a failed
// build keeps the last-good deploy live, far better than publishing blank pages.
const getAllStateInfos = memoize(async (): Promise<Map<string, StateInfo>> => {
  const map = new Map<string, StateInfo>();
  if (!process.env.NOTION_TOKEN || !STATES_DB) return map;

  const pages = await withNotionRetry(() => queryAllPages(STATES_DB));
  const byCode = new Map<string, PageObjectResponse[]>();
  for (const page of pages) {
    const code = getText(page, "Abbreviation").toUpperCase();
    if (!code) continue;
    const group = byCode.get(code);
    if (group) group.push(page);
    else byCode.set(code, [page]);
  }
  for (const [code, rows] of byCode) {
    const canonical = pickCanonicalRow(rows);
    if (canonical) map.set(code, mapStateInfo(canonical));
  }
  return map;
});

export async function getStateInfo(stateCode: string): Promise<StateInfo | null> {
  if (!process.env.NOTION_TOKEN || !STATES_DB) return null;
  const all = await getAllStateInfos();
  // null now means only "no canonical row for this code" — a genuine not-found,
  // never a swallowed fetch error (getAllStateInfos throws on persistent failure).
  return all.get(stateCode.toUpperCase()) ?? null;
}

// Most-recent "Last Verified" across all states — the site-wide freshness signal
// for the homepage TrustBar (which has no single state to read). Reads the shared
// getAllStateInfos fetch, so it costs no extra Notion request. ISO date strings
// (YYYY-MM-DD) compare lexicographically, so string max = latest date.
export async function getLatestStateVerification(): Promise<string | null> {
  let latest: string | null = null;
  for (const info of (await getAllStateInfos()).values()) {
    if (info.lastVerified && (!latest || info.lastVerified > latest)) {
      latest = info.lastVerified;
    }
  }
  return latest;
}

// ─── LINKABLE STATES (single shared gate) ───────────────────
//
// ONE gate for the whole site: a state is eligible for the XML sitemap AND every
// internal-link surface (homepage grid, NearbyStates, blog↔state cross-links,
// footer "Browse by state") once — and only once — its Content Status is
// Complete. We deliberately do NOT link or sitemap Partial/thin pages: the
// bottleneck is crawl budget and site-level trust, not discovery, so linking a
// thin page spends crawl budget on something that can't rank and feeds a
// low-quality site assessment. Concentration beats coverage. A page joins the
// link graph and the sitemap automatically the moment it flips to Complete — no
// manual step.
//
// This is the single source of truth for the gate: the Content Status filter
// lives here and nowhere else. The States DB still carries duplicate rows per
// state from prior seed batches, but a Content Status filter only returns the
// populated (Complete) row, so dedup is implicit. cache() dedupes the Notion
// call across one render (e.g. a page and its footer both call this) to a single
// query.
export const getLinkableStateCodes = cache(async (): Promise<Set<string>> => {
  // Derived from the shared getAllStateInfos fetch (canonical row per code), so
  // it adds no Notion request. A code is linkable once its canonical row is
  // Content Status = Complete — the same row the page actually renders.
  const set = new Set<string>();
  const all = await getAllStateInfos();
  for (const [code, info] of all) {
    if (info.contentStatus === "Complete") set.add(code);
  }
  return set;
});

// Per-code content-freshness date (the canonical row's "Last Verified") for the
// sitemap's <lastmod>. Reuses the shared getAllStateInfos fetch, so it adds no
// Notion request. Value is a "YYYY-MM-DD" string, or null when a state has no
// Last Verified date set. Using the real editorial date — not build time — is
// what keeps Google trusting our lastmod signal.
export const getStateVerificationMap = cache(
  async (): Promise<Map<string, string | null>> => {
    const map = new Map<string, string | null>();
    const all = await getAllStateInfos();
    for (const [code, info] of all) {
      map.set(code, info.lastVerified ?? null);
    }
    return map;
  }
);

// Full StateMeta (slug/name/code) for every linkable state, alphabetical by name
// (STATE_LIST order). The shared helper behind every internal-linking surface.
export const getLinkableStates = cache(async (): Promise<StateMeta[]> => {
  const codes = await getLinkableStateCodes();
  return STATE_LIST.filter((s) => codes.has(s.code.toUpperCase()));
});

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

// Read state-specific fields like "Pros CA", "Pros TX", "Cons GA" etc.
// Returns a Record keyed by state code with parsed lines.
// Fields that don't exist in Notion return empty string → empty array → not in the record.
const STATE_CODES_TO_CHECK = [
  "CA", "TX", "FL", "NY", "AZ", "GA", "OH", "IL", "VA", "CO",
  "NV", "NJ", "PA", "MI", "TN", "MO", "WI", "IN", "KS", "LA",
  "OK", "NE", "MD", "WA", "OR", "CT", "NM", "ND", "SC",
];

function buildStateSpecificField(
  page: PageObjectResponse,
  fieldPrefix: string
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const code of STATE_CODES_TO_CHECK) {
    const raw = getText(page, `${fieldPrefix} ${code}`);
    if (raw) {
      const lines = parseLines(raw);
      if (lines.length > 0) result[code] = lines;
    }
  }
  return result;
}

const PRICE_STATE_CODES = ["CA", "TX", "FL", "NY", "AZ", "OH", "VA", "NJ", "MI", "WA", "NC"];

function buildStatePrices(page: PageObjectResponse): Partial<Record<string, number>> {
  const result: Partial<Record<string, number>> = {};
  for (const code of PRICE_STATE_CODES) {
    const val = getNumber(page, `Price ${code}`);
    if (val !== null) result[code] = val;
  }
  return result;
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
    statePros: buildStateSpecificField(page, "Pros"),
    stateCons: buildStateSpecificField(page, "Cons"),
    bestFor: getText(page, "Best For"),
    notFor: getText(page, "Not For"),
    mobileApp: getCheckbox(page, "Mobile App"),
    moneyBackGuarantee: getCheckbox(page, "Money Back Guarantee"),
    certificateDelivery: getSelect(page, "Certificate Delivery") as School["certificateDelivery"],
    courtAcceptance: getSelect(page, "Court Acceptance") as School["courtAcceptance"],
    founded: getNumber(page, "Founded"),
    showOnSite: getCheckbox(page, "Show On Site"),
    lastVerified: getDate(page, "Last Verified"),
    genericPrice: getNumber(page, "Price"),
    statePrices: buildStatePrices(page),
    trackingMethod: getSelect(page, "Tracking Method") as School["trackingMethod"],
    partnerSlug: getText(page, "Partner Slug"),
    couponCode: getText(page, "Coupon Code"),
  };
}

const MONETIZABLE_NETWORKS = ["CJ", "Impact", "ShareASale", "Direct", "Pending"];

function isEligibleToShow(school: School): boolean {
  if (!school.showOnSite) return false;
  if (!MONETIZABLE_NETWORKS.includes(school.affiliateNetwork ?? "")) return false;
  return true;
}

export const getAllSchools = memoize(async (): Promise<School[]> => {
  if (!process.env.NOTION_TOKEN || !SCHOOLS_DB) return [];
  try {
    const response = await withNotionRetry(() =>
      notion.databases.query({
        database_id: SCHOOLS_DB,
        filter: {
          and: [
            { property: "Status", select: { equals: "Active" } },
            { property: "Show On Site", checkbox: { equals: true } },
          ],
        },
        sorts: [{ property: "Rating", direction: "descending" }],
      })
    );
    return (response.results as PageObjectResponse[]).map(mapSchool).filter(isEligibleToShow);
  } catch {
    return [];
  }
});

export async function getSchoolBySlug(slug: string): Promise<School | null> {
  const all = await getAllSchools();
  return all.find((s) => s.slug === slug) ?? null;
}

// ─── SCHOOL REVIEW BODY (Notion page block children) ────────

const REVIEW_BLOCK_TYPES = new Set<ReviewBlockType>([
  "paragraph",
  "heading_2",
  "heading_3",
  "bulleted_list_item",
  "numbered_list_item",
]);

// SECURITY: never surface an internal Notion link on the public site. CMS bodies
// sometimes carry cross-reference phrases linked to app.notion.com/notion.so URLs
// (private pages — this was the visible tail of the P0). Drop any such href → the
// text renders plain, and the question-page body linker re-adds the correct
// SITE-relative link for known phrases (gated on the target being Complete).
function sanitizeHref(href: string | null | undefined): string | null {
  if (!href) return null;
  if (/^https?:\/\/(?:[a-z0-9-]+\.)*notion\.(?:so|com|site)\b/i.test(href.trim())) return null;
  return href;
}

function mapReviewRichText(rich: any[] | undefined): ReviewRichText[] {
  return (rich ?? []).map((r: any) => ({
    text: r.plain_text ?? "",
    bold: r.annotations?.bold ?? false,
    italic: r.annotations?.italic ?? false,
    href: sanitizeHref(r.href),
  }));
}

// The long-form written review lives in the School's Notion page BODY (blocks),
// not in a property — so it needs blocks.children.list, paginated. The School's
// `id` is the page id. This is a legitimate per-page fetch (one request per
// review page, ~10 total) — not the batched-table pattern, because Notion has no
// bulk "page bodies" query. cache() dedupes within a render; ISR/build keep it
// cheap. Only the block types we render are kept; empty/spacer blocks dropped.
// Returns [] for a page with no renderable body (school renders no review section).
export const getSchoolReviewBody = cache(async (pageId: string): Promise<ReviewBlock[]> => {
  if (!process.env.NOTION_TOKEN) return [];
  // GUARD (same risk class as the question-page incident): only render the blocks
  // of a page that provably belongs to the Traffic Schools DB. If the API mis-serves
  // this id as another workspace page, its parent won't match → [] (no body).
  if (!(await pageBelongsTo(pageId, SCHOOLS_PARENT_IDS))) return [];
  const blocks: ReviewBlock[] = [];
  let cursor: string | undefined;
  do {
    const res = await withNotionRetry(() =>
      notion.blocks.children.list({ block_id: pageId, start_cursor: cursor, page_size: 100 })
    );
    for (const block of res.results as any[]) {
      const type = block.type as string;
      if (!REVIEW_BLOCK_TYPES.has(type as ReviewBlockType)) continue;
      const richText = mapReviewRichText(block[type]?.rich_text);
      // Skip blank blocks (e.g. Notion spacer paragraphs) so we don't emit empty <p>.
      if (richText.every((r) => r.text.trim() === "")) continue;
      blocks.push({ type: type as ReviewBlockType, richText });
    }
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return blocks;
});

// ─── STATE QUESTION PAGES DB (/{state}/{question-slug}) ──────
//
// P0 INCIDENT HARDENING (2026-08-25): a question route may render ONLY a row that
// provably belongs to the Question Pages data source. Two independent guards below
// mean that even if the Notion API ever returns a foreign page under load (the
// necessary condition for the incident, together with an over-broad token):
//   (1) parent-id allowlist — the row's parent must be the Question Pages
//       database/data source, else it is dropped; and
//   (2) schema validation — the row must carry State Slug + Question Slug + H1.
// A recipe / Credentials-Vault page satisfies neither, so it can never become a
// QuestionPage. The structural fix remains the SCOPED token (see incident notes).

// Allowlist of parent ids that a legitimate Question Pages row may have. Both the
// database container id (the NOTION_QUESTIONS_DB env) and the data source id are
// accepted (Notion reports one or the other depending on API version). Normalized
// (dashless, lowercase) for comparison.
// Parent-source allowlist is derived from the env DB id (Notion reports row parents
// as { database_id: <NOTION_QUESTIONS_DB> }). No hardcoded ids — nothing to rot on a
// workspace migration.
const QP_PARENT_IDS = new Set([normId(QUESTIONS_DB)].filter(Boolean));
const belongsToQuestionsDb = (p: PageObjectResponse): boolean => QP_PARENT_IDS.has(pageParentDbId(p));

// All COMPLETE question rows, once per build. Same gate discipline as state
// pages: only Content Status === "Complete" exists as a page. Returns [] if the
// DB is unset or unreachable — the build then renders zero question pages, never a
// placeholder. FAIL-CLOSED: any query error → [] (no pages), never fallback content.
export const getQuestionPages = memoize(async (): Promise<QuestionPage[]> => {
  if (!process.env.NOTION_TOKEN || !QUESTIONS_DB) return [];
  try {
    const pages = await withNotionRetry(() =>
      queryAllPages(QUESTIONS_DB, { property: "Content Status", select: { equals: "Complete" } })
    );
    return pages
      .filter(belongsToQuestionsDb) // guard 1: provably a Question Pages row
      .map((p) => ({
        id: p.id,
        title: getText(p, "Title"),
        stateCode: getText(p, "State Code").toUpperCase(),
        stateSlug: getText(p, "State Slug").toLowerCase(),
        questionSlug: getText(p, "Question Slug").toLowerCase(),
        h1: getText(p, "H1"),
        titleTag: getFullRichText(p, "Title Tag"),
        metaDescription: getFullRichText(p, "Meta Description"),
        lastVerified: getDate(p, "Last Verified"),
        sources: getFullRichText(p, "Sources"),
      }))
      .filter((q) => q.stateSlug && q.questionSlug && q.h1); // guard 2: QP schema present
  } catch {
    return []; // fail-closed: no pages, never foreign/placeholder content.
  }
});

// Exactly-one-row lookup. 0 matches OR >1 (a duplicate) → null → the route 404s.
export async function getQuestionPage(stateSlug: string, questionSlug: string): Promise<QuestionPage | null> {
  const matches = (await getQuestionPages()).filter(
    (q) => q.stateSlug === stateSlug.toLowerCase() && q.questionSlug === questionSlug.toLowerCase()
  );
  return matches.length === 1 ? matches[0] : null;
}

// Complete question pages for one state (drives the state page's "Common questions" block).
export async function getQuestionsForState(stateSlug: string): Promise<QuestionPage[]> {
  return (await getQuestionPages()).filter((q) => q.stateSlug === stateSlug.toLowerCase());
}

// Parse the page body (blocks) into the three `## Key Facts` / `## Body` /
// `## Sources` sections. Key Facts are `Label: value` lines → <dl>; Body/Sources
// keep the renderable block types. hasQA flags a real Q&A subsection (a heading_3
// ending in "?") so an FAQPage node is only emitted when one actually exists.
const QUESTION_BODY_TYPES = new Set<ReviewBlockType>([
  "paragraph", "heading_2", "heading_3", "bulleted_list_item", "numbered_list_item",
]);
// FAIL-CLOSED: returns null on ANY fetch error (missing token, 429 after retries,
// network) so the route 404s rather than rendering partial/absent content. Called
// ONLY with a page id from a parent+schema-validated getQuestionPages row.
export const getQuestionBody = cache(async (pageId: string): Promise<QuestionBody | null> => {
  if (!process.env.NOTION_TOKEN) return null;
  // GUARD (incident symptom was foreign content under a valid route): confirm the
  // page at this id is actually a Question Pages row before rendering its blocks.
  // If the API ever mis-serves this id as another workspace page, its parent won't
  // be the Question Pages DB → null → 404. Belt-and-suspenders with the scoped token.
  if (!(await pageBelongsTo(pageId, QP_PARENT_IDS))) return null; // fail-closed
  const raw: { type: string; rich: ReviewRichText[] }[] = [];
  let cursor: string | undefined;
  try {
    do {
      const res = await withNotionRetry(() =>
        notion.blocks.children.list({ block_id: pageId, start_cursor: cursor, page_size: 100 })
      );
      for (const block of res.results as any[]) {
        const type = block.type as string;
        raw.push({ type, rich: mapReviewRichText(block[type]?.rich_text) });
      }
      cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
    } while (cursor);
  } catch {
    return null; // fail-closed → route 404s.
  }

  const keyFacts: QuestionKeyFact[] = [];
  const body: ReviewBlock[] = [];
  const sources: ReviewBlock[] = [];
  let section: "keyFacts" | "body" | "sources" | null = null;
  for (const b of raw) {
    const text = b.rich.map((r) => r.text).join("");
    if (b.type === "heading_2") {
      const h = text.trim().toLowerCase();
      section = h === "key facts" ? "keyFacts" : h === "body" ? "body" : h === "sources" ? "sources" : null;
      continue;
    }
    if (text.trim() === "") continue;
    if (section === "keyFacts") {
      const idx = text.indexOf(":");
      if (idx > 0) keyFacts.push({ label: text.slice(0, idx).trim(), value: text.slice(idx + 1).trim() });
    } else if (section === "body" && QUESTION_BODY_TYPES.has(b.type as ReviewBlockType)) {
      body.push({ type: b.type as ReviewBlockType, richText: b.rich });
    } else if (section === "sources" && QUESTION_BODY_TYPES.has(b.type as ReviewBlockType)) {
      sources.push({ type: b.type as ReviewBlockType, richText: b.rich });
    }
  }
  const hasQA = body.some((blk) => blk.type === "heading_3" && /\?\s*$/.test(blk.richText.map((r) => r.text).join("")));
  return { keyFacts, body, sources, hasQA };
});

// ─── SCHOOL PRICING DB ──────────────────────────────────────

type PricingInfo = {
  price: number | null;
  originalPrice: number | null;
  affiliateUrl: string;
  priceNote: string;
  approved: boolean;
  hasActiveOffer: boolean;
  salePrice: number | null;
  offerSeen: string | null;   // ISO date the scraper last confirmed the offer (null = manual)
};

// A scraper-set offer is only live while it keeps being re-confirmed: once "Offer
// Seen" is older than this, the offer drops on its own (no unreliable "no-offer"
// detection). Manual offers (no Offer Seen date) are honored indefinitely.
const OFFER_TTL_DAYS = 3;
function offerIsFresh(offerSeen: string | null): boolean {
  if (!offerSeen) return true; // manual flag — honored until a human clears it
  const seen = new Date(offerSeen).getTime();
  if (Number.isNaN(seen)) return true;
  return Date.now() - seen <= OFFER_TTL_DAYS * 86_400_000;
}

// One fetch of every approved pricing row per build, grouped by state code then
// school id. Replaces the per-state Pricing query (51 → 1).
const getAllPricingByState = memoize(
  async (): Promise<Map<string, Map<string, PricingInfo>>> => {
    const byState = new Map<string, Map<string, PricingInfo>>();
    if (!process.env.NOTION_TOKEN || !PRICING_DB) return byState;
    try {
      const pages = await withNotionRetry(() =>
        queryAllPages(PRICING_DB, { property: "Approved", checkbox: { equals: true } })
      );
      for (const pp of pages) {
        const code = getText(pp, "State Code").toUpperCase();
        const schoolId = getRelationIds(pp, "School")[0];
        if (!code || !schoolId) continue;
        let forState = byState.get(code);
        if (!forState) {
          forState = new Map<string, PricingInfo>();
          byState.set(code, forState);
        }
        forState.set(schoolId, {
          price: getNumber(pp, "Price"),
          originalPrice: getNumber(pp, "Original Price"),
          affiliateUrl: getText(pp, "Affiliate URL"),
          priceNote: getText(pp, "Price Note"),
          approved: true,
          hasActiveOffer: getCheckbox(pp, "Active Offer"),
          salePrice: getNumber(pp, "Sale Price"),
          offerSeen: getDate(pp, "Offer Seen"),
        });
      }
    } catch {
      // Pricing DB may not exist yet — states resolve without price overrides.
    }
    return byState;
  }
);

export async function getSchoolPricingForState(
  stateCode: string
): Promise<SchoolWithPrice[]> {
  if (!process.env.NOTION_TOKEN || !SCHOOLS_DB) return [];

  const schools = await getAllSchools();
  if (schools.length === 0) return [];

  const code = stateCode.toUpperCase();
  const pricingMap =
    (await getAllPricingByState()).get(code) ?? new Map<string, PricingInfo>();

  // Merge schools with their state-specific pricing
  const results: SchoolWithPrice[] = [];
  for (const school of schools) {
    // Check if school serves this state
    const servesState =
      school.stateCodes.includes("all") || school.stateCodes.includes(code);
    if (!servesState) continue;

    const pricing = pricingMap.get(school.id);
    // Effective offer: checkbox on AND fresh (manual flag, or scraper-confirmed
    // within the TTL). Sale price is surfaced only while the offer is live, so a
    // stale sale can never render.
    const offerLive = (pricing?.hasActiveOffer ?? false) && offerIsFresh(pricing?.offerSeen ?? null);

    results.push({
      ...school,
      price: pricing?.price ?? school.genericPrice ?? null,
      pricingPrice: pricing?.price ?? null, // raw Pricing-DB value only (no generic fallback)
      originalPrice: pricing?.originalPrice ?? null,
      stateAffiliateUrl: pricing?.affiliateUrl || null,
      priceNote: pricing?.priceNote || null,
      hasActiveOffer: offerLive,
      salePrice: offerLive ? (pricing?.salePrice ?? null) : null,
    });
  }

  // Sort: Tier 1 first, then any school with a live offer floats up (a neutral
  // "current deal" signal — not partner-specific — consistent with our published
  // "lower prices/promotions rank higher" methodology), then by price (nulls last).
  return results.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    if (a.hasActiveOffer !== b.hasActiveOffer) return a.hasActiveOffer ? -1 : 1;
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

// Full Directory scan, cached per render. Filtering by state name in memory
// avoids a per-state `State` select-equals filter: Notion rejects a select
// filter whose value isn't an existing option (HTTP 400 — which the Notion SDK
// logs at WARN before we can catch it), so every state with no directory rows
// spammed a validation_error at build time. A state name is data, not a schema
// option, so it should never gate the query.
const getAllDirectorySchools = memoize(async (): Promise<DirectorySchool[]> => {
  if (!process.env.NOTION_TOKEN || !DIRECTORY_DB) return [];
  try {
    const pages = await withNotionRetry(() =>
      queryAllPages(DIRECTORY_DB, undefined, [
        { property: "School Name", direction: "ascending" },
      ])
    );
    return pages.map(mapDirectorySchool);
  } catch {
    return [];
  }
});

export async function getDirectoryForState(
  stateName: string
): Promise<DirectorySchool[]> {
  const all = await getAllDirectorySchools();
  return all.filter((d) => d.state === stateName);
}

// ─── PROS/CONS HELPER ───────────────────────────────────────

export function getProsForState(school: School | SchoolWithPrice, stateCode: string): string[] {
  return school.statePros[stateCode.toUpperCase()] ?? school.pros;
}

export function getConsForState(school: School | SchoolWithPrice, stateCode: string): string[] {
  return school.stateCons[stateCode.toUpperCase()] ?? school.cons;
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

// ─── STATE REQUIREMENTS DB ──────────────────────────────────

function mapStateRequirement(page: PageObjectResponse): StateRequirement {
  return {
    id: page.id,
    stateCode: getText(page, "State Code"),
    stateName: getText(page, "State Name"),
    officialTerm: getSelect(page, "Official Term") ?? "",
    approvalBody: getText(page, "Approval Body"),
    approvalBodyShort: getText(page, "Approval Body Short"),
    mandatedHours: getNumber(page, "Mandated Hours"),
    hasFinalExam: getCheckbox(page, "Has Final Exam"),
    examIsOpenBook: getCheckbox(page, "Exam Is Open Book"),
    examAttemptsAllowed: getNumber(page, "Exam Attempts Allowed"),
    hasLessonTimers: getCheckbox(page, "Has Lesson Timers"),
    ticketOutcome: getSelect(page, "Ticket Outcome") ?? "",
    ticketOutcomeNote: getText(page, "Ticket Outcome Note"),
    eligibilityWindowMonths: getNumber(page, "Eligibility Window Months"),
    certificateDelivery: getSelect(page, "Certificate Delivery") ?? "",
    courtFeeRequired: getCheckbox(page, "Court Fee Required"),
    courtFeeNote: getText(page, "Court Fee Note"),
    dmvLicenseRequired: getCheckbox(page, "DMV License Required"),
    licenseFormat: getText(page, "License Format"),
    terminologyNotes: getText(page, "Terminology Notes"),
    sourceUrl: getText(page, "Source URL"),
    lastVerified: getDate(page, "Last Verified"),
  };
}

export const getStateRequirements = memoize(
  async (): Promise<Map<string, StateRequirement>> => {
    const map = new Map<string, StateRequirement>();
    if (!process.env.NOTION_TOKEN || !STATE_REQUIREMENTS_DB) return map;
    try {
      const pages = await withNotionRetry(() => queryAllPages(STATE_REQUIREMENTS_DB));
      for (const page of pages) {
        const req = mapStateRequirement(page);
        if (req.stateCode) map.set(req.stateCode, req);
      }
    } catch { /* DB may not exist yet */ }
    return map;
  }
);

// ─── SCHOOL STATE VARIANTS DB ───────────────────────────────

function mapSchoolVariant(page: PageObjectResponse): SchoolStateVariant {
  const prosRaw = getText(page, "Pros");
  const consRaw = getText(page, "Cons");
  return {
    id: page.id,
    name: getText(page, "Name"),
    schoolSlug: getText(page, "School Slug"),
    stateCode: getSelect(page, "State Code") ?? "",
    generationStatus: (getSelect(page, "Generation Status") ?? "Generated") as SchoolStateVariant["generationStatus"],
    lockReason: getText(page, "Lock Reason"),
    oneLiner: getText(page, "One Liner"),
    pros: prosRaw ? prosRaw.split("|").map(s => s.trim()).filter(Boolean) : [],
    cons: consRaw ? consRaw.split("|").map(s => s.trim()).filter(Boolean) : [],
    bestFor: getText(page, "Best For"),
    notFor: getText(page, "Not For"),
    priceOverride: getNumber(page, "Price Override"),
    hasFinalExamOverride: getSelect(page, "Has Final Exam Override") as SchoolStateVariant["hasFinalExamOverride"],
    generationNotes: getText(page, "Generation Notes"),
    lastGenerated: getDate(page, "Last Generated"),
  };
}

// Full Variants scan, cached per render. Filtering by state in memory avoids a
// per-state `State Code` select-equals filter, which 400s (SDK-logged at WARN)
// for every state whose code isn't among the DB's select options — i.e. any
// state with no variant rows yet. Same class of fix as getAllDirectorySchools.
const getAllSchoolVariants = memoize(async (): Promise<SchoolStateVariant[]> => {
  if (!process.env.NOTION_TOKEN || !SCHOOL_VARIANTS_DB) return [];
  try {
    const pages = await withNotionRetry(() => queryAllPages(SCHOOL_VARIANTS_DB));
    return pages.map(mapSchoolVariant);
  } catch {
    return []; // DB may not exist yet
  }
});

export async function getSchoolVariantsForState(
  stateCode: string
): Promise<Map<string, SchoolStateVariant>> {
  const code = stateCode.toUpperCase();
  const map = new Map<string, SchoolStateVariant>();
  for (const variant of await getAllSchoolVariants()) {
    if (variant.stateCode.toUpperCase() === code) {
      map.set(variant.name, variant); // keyed by "slug:STATE"
    }
  }
  return map;
}

// ─── RESOLVE STATE CONTENT ──────────────────────────────────

export function resolveStateContent(
  school: School | SchoolWithPrice,
  stateCode: string | null,
  stateReqs: Map<string, StateRequirement>,
  variants: Map<string, SchoolStateVariant>
): import("./types").ResolvedSchoolContent {
  const variant = stateCode ? variants.get(`${school.slug}:${stateCode}`) : undefined;
  const state = stateCode ? stateReqs.get(stateCode) : undefined;

  // Price waterfall (WS2 collapse): variant override → RAW Pricing-DB value (the
  // verified price, synced from the Scraper Rules DB) → per-state Schools column
  // (legacy fallback). Each of these is a genuine PER-STATE price.
  const stateVerifiedPrice =
    variant?.priceOverride ??
    ("pricingPrice" in school ? (school as SchoolWithPrice).pricingPrice : null) ??
    (stateCode ? school.statePrices[stateCode] : undefined) ??
    null;

  // Generic fallback, but ONLY for schools that don't price per state. A school
  // that DOES vary by state (any per-state column price, e.g. I Drive Safely,
  // whose real state prices run $19–$49) must not display its flat generic as if
  // it were the state price — show "Check website" instead. That also drops it
  // from the Product ItemList (no fabricated Offer). Flat-price schools
  // (no per-state prices anywhere) keep their generic price as intended.
  const variesByState = Object.keys(school.statePrices).length > 0;
  const price = stateVerifiedPrice ?? (variesByState ? null : (school.genericPrice ?? null));

  // Has Final Exam: variant override → state requirement → true (conservative default)
  const hasFinalExam =
    variant?.hasFinalExamOverride === "Yes" ? true :
    variant?.hasFinalExamOverride === "No" ? false :
    state?.hasFinalExam ?? true;

  return {
    // Editorial — variant overrides school defaults
    oneLiner: variant?.oneLiner || school.tagline || null,
    pros: variant?.pros?.length ? variant.pros : getProsForState(school, stateCode ?? ""),
    cons: variant?.cons?.length ? variant.cons : getConsForState(school, stateCode ?? ""),
    bestFor: variant?.bestFor || school.bestFor || null,
    notFor: variant?.notFor || school.notFor || null,

    // Price
    price,
    priceDisplay: price !== null ? `$${price.toFixed(2)}` : "Check website",

    // Regulatory — structural facts from state requirements
    officialTerm: state?.officialTerm ?? "Traffic School",
    approvalBody: state?.approvalBody ?? "State Approved",
    approvalBodyShort: state?.approvalBodyShort ?? "State Approved",
    hasFinalExam,
    examAttemptsAllowed: state?.examAttemptsAllowed ?? null,
    examIsOpenBook: state?.examIsOpenBook ?? false,
    hasLessonTimers: state?.hasLessonTimers ?? false,
    ticketOutcome: state?.ticketOutcome ?? "Varies",
    ticketOutcomeNote: state?.ticketOutcomeNote ?? null,
    eligibilityWindowMonths: state?.eligibilityWindowMonths ?? null,
    courtFeeRequired: state?.courtFeeRequired ?? false,
    courtFeeNote: state?.courtFeeNote ?? null,
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
