/**
 * Generates state-specific editorial content for school comparison cards.
 * Uses Claude to generate One Liner, Pros, Cons, Best For, Not For per school x state.
 * Writes results to the School State Variants Notion database.
 *
 * Usage:
 *   npx tsx scripts/generate-state-variants.ts                    # all schools x states
 *   npx tsx scripts/generate-state-variants.ts --school safe2drive # one school
 *   npx tsx scripts/generate-state-variants.ts --state CA         # one state
 *   npx tsx scripts/generate-state-variants.ts --dry-run          # preview without writing
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import Anthropic from "@anthropic-ai/sdk";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DB = {
  trafficSchools: process.env.NOTION_SCHOOLS_DB!,
  stateRequirements: process.env.NOTION_STATE_REQUIREMENTS_DB!,
  schoolStateVariants: process.env.NOTION_SCHOOL_VARIANTS_DB!,
};

const DRY_RUN = process.argv.includes("--dry-run");
const SCHOOL_FILTER = getArgValue("--school");
const STATE_FILTER = getArgValue("--state")?.toUpperCase();

function getArgValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx >= 0 && idx + 1 < process.argv.length ? process.argv[idx + 1] : undefined;
}

if (!process.env.NOTION_TOKEN) { console.error("Missing NOTION_TOKEN"); process.exit(1); }
if (!process.env.ANTHROPIC_API_KEY) { console.error("Missing ANTHROPIC_API_KEY"); process.exit(1); }
if (!DB.trafficSchools || !DB.stateRequirements || !DB.schoolStateVariants) {
  console.error("Missing NOTION_SCHOOLS_DB, NOTION_STATE_REQUIREMENTS_DB, or NOTION_SCHOOL_VARIANTS_DB");
  process.exit(1);
}

// ─── TYPES ─────────────────────────────────────────────────

interface SchoolData {
  id: string;
  slug: string;
  name: string;
  stateCodes: string[];
  rating: number | null;
  reviewCount: number | null;
  reviewSource: string;
  completionHours: number | null;
  mobileApp: boolean;
  moneyBackGuarantee: boolean;
  certificateDelivery: string;
  oneLiner: string;
  pros: string;
  cons: string;
  bestFor: string;
  notFor: string;
  genericPrice: number | null;
}

interface StateReq {
  officialTerm: string;
  approvalBody: string;
  approvalBodyShort: string;
  mandatedHours: number | null;
  hasFinalExam: boolean;
  examIsOpenBook: boolean;
  examAttemptsAllowed: number | null;
  hasLessonTimers: boolean;
  ticketOutcome: string;
  ticketOutcomeNote: string;
  eligibilityWindowMonths: number | null;
  courtFeeRequired: boolean;
  courtFeeNote: string;
  terminologyNotes: string;
}

interface GeneratedContent {
  oneLiner: string;
  pros: string;
  cons: string;
  bestFor: string;
  notFor: string;
  generationNotes: string;
}

// ─── NOTION HELPERS ────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */

function getText(page: any, field: string): string {
  const prop = page.properties?.[field];
  if (!prop) return "";
  if (prop.type === "rich_text") return prop.rich_text?.[0]?.plain_text ?? "";
  if (prop.type === "title") return prop.title?.[0]?.plain_text ?? "";
  if (prop.type === "url") return prop.url ?? "";
  return "";
}

function getNumber(page: any, field: string): number | null {
  return page.properties?.[field]?.number ?? null;
}

function getSelect(page: any, field: string): string | null {
  return page.properties?.[field]?.select?.name ?? null;
}

function getCheckbox(page: any, field: string): boolean {
  return page.properties?.[field]?.checkbox ?? false;
}

async function queryAll(dbId: string, filter?: any): Promise<any[]> {
  const results: any[] = [];
  let cursor: string | undefined;
  do {
    const params: any = { database_id: dbId, page_size: 100, start_cursor: cursor };
    if (filter) params.filter = filter;
    const resp: any = await notion.databases.query(params);
    results.push(...resp.results);
    cursor = resp.has_more ? resp.next_cursor : undefined;
  } while (cursor);
  return results;
}

function richText(text: string) {
  return { rich_text: [{ text: { content: text.slice(0, 2000) } }] };
}

function title(text: string) {
  return { title: [{ text: { content: text } }] };
}

// ─── LOAD DATA ─────────────────────────────────────────────

async function loadSchools(): Promise<SchoolData[]> {
  const pages = await queryAll(DB.trafficSchools, {
    and: [
      { property: "Status", select: { equals: "Active" } },
      { property: "Show On Site", checkbox: { equals: true } },
    ],
  });

  return pages.map((p): SchoolData => {
    const rawCodes = getText(p, "State Codes");
    const stateCodes = rawCodes.toLowerCase() === "all"
      ? ["all"]
      : rawCodes.split(",").map(s => s.trim().toUpperCase()).filter(Boolean);

    return {
      id: p.id,
      slug: getText(p, "Slug") || getText(p, "School Name").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      name: getText(p, "School Name"),
      stateCodes,
      rating: getNumber(p, "Rating"),
      reviewCount: getNumber(p, "Review Count"),
      reviewSource: getSelect(p, "Review Source") ?? "Trustpilot",
      completionHours: getNumber(p, "Completion Time (hrs)"),
      mobileApp: getCheckbox(p, "Mobile App"),
      moneyBackGuarantee: getCheckbox(p, "Money Back Guarantee"),
      certificateDelivery: getSelect(p, "Certificate Delivery") ?? "Electronic",
      oneLiner: getText(p, "One Liner"),
      pros: getText(p, "Pros"),
      cons: getText(p, "Cons"),
      bestFor: getText(p, "Best For"),
      notFor: getText(p, "Not For") || "",
      genericPrice: getNumber(p, "Price"),
    };
  });
}

async function loadStateRequirements(): Promise<Map<string, StateReq>> {
  const pages = await queryAll(DB.stateRequirements);
  const map = new Map<string, StateReq>();

  for (const p of pages) {
    const code = getText(p, "State Code");
    if (!code) continue;
    map.set(code, {
      officialTerm: getSelect(p, "Official Term") ?? "",
      approvalBody: getText(p, "Approval Body"),
      approvalBodyShort: getText(p, "Approval Body Short"),
      mandatedHours: getNumber(p, "Mandated Hours"),
      hasFinalExam: getCheckbox(p, "Has Final Exam"),
      examIsOpenBook: getCheckbox(p, "Exam Is Open Book"),
      examAttemptsAllowed: getNumber(p, "Exam Attempts Allowed"),
      hasLessonTimers: getCheckbox(p, "Has Lesson Timers"),
      ticketOutcome: getSelect(p, "Ticket Outcome") ?? "",
      ticketOutcomeNote: getText(p, "Ticket Outcome Note"),
      eligibilityWindowMonths: getNumber(p, "Eligibility Window Months"),
      courtFeeRequired: getCheckbox(p, "Court Fee Required"),
      courtFeeNote: getText(p, "Court Fee Note"),
      terminologyNotes: getText(p, "Terminology Notes"),
    });
  }
  return map;
}

async function loadExistingVariants(): Promise<Map<string, { id: string; status: string }>> {
  const pages = await queryAll(DB.schoolStateVariants);
  const map = new Map<string, { id: string; status: string }>();

  for (const p of pages) {
    const name = getText(p, "Name");
    if (name) {
      map.set(name, {
        id: p.id,
        status: getSelect(p, "Generation Status") ?? "Generated",
      });
    }
  }
  return map;
}

// ─── GENERATION ────────────────────────────────────────────

const SYSTEM_PROMPT = `You are writing comparison card content for trafficschoolpicker.com, a traffic school
review site. You will be given data about a traffic school and the regulatory requirements
for a specific US state. Generate state-specific card content that is accurate, concise,
and helpful to a driver who just got a ticket in that state.

OUTPUT FORMAT — respond with valid JSON only, no markdown:
{
  "oneLiner": "string, max 100 chars, no price, state-aware",
  "pros": "pipe-delimited string of 3-5 pros, state-accurate",
  "cons": "pipe-delimited string of 2-4 cons, honest",
  "bestFor": "string, one sentence describing ideal customer in this state",
  "notFor": "string, one sentence describing who should look elsewhere",
  "generationNotes": "string, brief explanation of key editorial decisions made"
}

RULES:
- Only claim "no final exam" if Has Final Exam = false for this state
- Reference the correct approval body (CA DMV, TDLR, AZ Supreme Court, etc.)
- Use the state's official course term in copy (Traffic Violator School for CA, Defensive Driving for TX/AZ, etc.)
- Use "mask" for CA ticket outcomes, "dismiss" for AZ/TX
- Do not include price in One Liner — it is rendered separately
- Pros and Cons must be factually grounded in the school data and state requirements provided
- Write for a stressed driver who just got a ticket — be reassuring, clear, not salesy
- Cons should be honest and useful, not just filler`;

function buildPrompt(school: SchoolData, stateCode: string, state: StateReq): string {
  return `SCHOOL DATA:
Name: ${school.name}
Rating: ${school.rating ?? "N/A"} (${school.reviewCount ?? 0} reviews on ${school.reviewSource})
Completion Time: ${school.completionHours ?? "unknown"} hours
Has Mobile App: ${school.mobileApp}
Money Back Guarantee: ${school.moneyBackGuarantee}
Certificate Delivery: ${school.certificateDelivery}
Price: ${school.genericPrice ? `$${school.genericPrice}` : "unknown"}
Global One Liner: ${school.oneLiner}
Global Pros: ${school.pros}
Global Cons: ${school.cons}
Global Best For: ${school.bestFor}
Global Not For: ${school.notFor}

STATE REQUIREMENTS for ${stateCode}:
Official Term: ${state.officialTerm}
Approval Body: ${state.approvalBody}
Mandated Hours: ${state.mandatedHours ?? "none mandated"}
Has Final Exam: ${state.hasFinalExam}
Exam Is Open Book: ${state.examIsOpenBook}
Exam Attempts Allowed: ${state.examAttemptsAllowed ?? "N/A"}
Has Lesson Timers: ${state.hasLessonTimers}
Ticket Outcome: ${state.ticketOutcome} — ${state.ticketOutcomeNote}
Eligibility Window: ${state.eligibilityWindowMonths ?? "unknown"} months between completions
Court Fee Required: ${state.courtFeeRequired} ${state.courtFeeNote ?? ""}
Terminology Notes: ${state.terminologyNotes ?? "none"}

Generate state-specific card content for ${school.name} in ${stateCode}.`;
}

async function generateVariant(
  school: SchoolData,
  stateCode: string,
  state: StateReq
): Promise<GeneratedContent> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildPrompt(school, stateCode, state) }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map(b => b.text)
    .join("");

  // Strip potential markdown code fences
  const cleaned = text.replace(/^```json\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

  try {
    return JSON.parse(cleaned) as GeneratedContent;
  } catch {
    // Retry once on parse failure
    console.warn(`  JSON parse failed, retrying...`);
    const retry = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: SYSTEM_PROMPT + "\n\nIMPORTANT: Your previous response was not valid JSON. Respond with ONLY valid JSON, no markdown.",
      messages: [{ role: "user", content: buildPrompt(school, stateCode, state) }],
    });

    const retryText = retry.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map(b => b.text)
      .join("")
      .replace(/^```json\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

    try {
      return JSON.parse(retryText) as GeneratedContent;
    } catch {
      return {
        oneLiner: "",
        pros: "",
        cons: "",
        bestFor: "",
        notFor: "",
        generationNotes: "JSON parse failed after retry — requires manual review",
      };
    }
  }
}

// ─── WRITE TO NOTION ───────────────────────────────────────

const TODAY = new Date().toISOString().split("T")[0];

async function upsertVariant(
  key: string,
  slug: string,
  stateCode: string,
  content: GeneratedContent,
  existingId: string | undefined
) {
  const isFailed = content.generationNotes.includes("requires manual review");
  const properties: any = {
    "Name": title(key),
    "School Slug": richText(slug),
    "State Code": { select: { name: stateCode } },
    "Generation Status": { select: { name: isFailed ? "Needs Review" : "Generated" } },
    "One Liner": richText(content.oneLiner),
    "Pros": richText(content.pros),
    "Cons": richText(content.cons),
    "Best For": richText(content.bestFor),
    "Not For": richText(content.notFor),
    "Generation Notes": richText(content.generationNotes),
    "Last Generated": { date: { start: TODAY } },
  };

  if (existingId) {
    await notion.pages.update({ page_id: existingId, properties });
  } else {
    await notion.pages.create({
      parent: { database_id: DB.schoolStateVariants },
      properties,
    });
  }
}

// ─── MAIN ──────────────────────────────────────────────────

async function main() {
  if (DRY_RUN) console.log("=== DRY RUN — no writes ===\n");

  console.log("Loading data from Notion...");
  const [schools, stateReqs, existingVariants] = await Promise.all([
    loadSchools(),
    loadStateRequirements(),
    loadExistingVariants(),
  ]);

  console.log(`  Schools: ${schools.length}`);
  console.log(`  State Requirements: ${stateReqs.size} states`);
  console.log(`  Existing Variants: ${existingVariants.size}\n`);

  // Determine which states we have requirements for
  const availableStates = new Set(stateReqs.keys());

  let generated = 0;
  let skipped = 0;
  let locked = 0;
  let errors = 0;

  for (const school of schools) {
    if (SCHOOL_FILTER && school.slug !== SCHOOL_FILTER) continue;

    // Determine which states this school covers
    const stateCodes = school.stateCodes.includes("all")
      ? [...availableStates]
      : school.stateCodes.filter(c => availableStates.has(c));

    if (stateCodes.length === 0) {
      console.log(`${school.name} — no matching state requirements, skipping`);
      continue;
    }

    console.log(`\n━━ ${school.name} (${stateCodes.length} states) ━━`);

    for (const stateCode of stateCodes) {
      if (STATE_FILTER && stateCode !== STATE_FILTER) continue;

      const key = `${school.slug}:${stateCode}`;
      const existing = existingVariants.get(key);

      // CRITICAL: never overwrite Locked rows
      if (existing?.status === "Locked") {
        console.log(`  SKIP (Locked): ${key}`);
        locked++;
        continue;
      }

      const stateReq = stateReqs.get(stateCode);
      if (!stateReq) {
        console.log(`  SKIP (no state req): ${key}`);
        skipped++;
        continue;
      }

      console.log(`  Generating: ${key}...`);

      if (DRY_RUN) {
        console.log(`  Would generate: ${key}`);
        generated++;
        continue;
      }

      try {
        const content = await generateVariant(school, stateCode, stateReq);

        console.log(`    One Liner: ${content.oneLiner.slice(0, 80)}...`);
        console.log(`    Pros: ${content.pros.split("|").length} items`);
        console.log(`    Cons: ${content.cons.split("|").length} items`);

        await upsertVariant(key, school.slug, stateCode, content, existing?.id);
        generated++;

        // Rate limit
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        console.error(`  ERROR: ${(err as Error).message}`);
        errors++;
      }
    }
  }

  console.log("\n" + "─".repeat(60));
  console.log(`Generated: ${generated} | Skipped: ${skipped} | Locked: ${locked} | Errors: ${errors}`);
  if (DRY_RUN) console.log("(Dry run — no changes written)");
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
