/**
 * Populates the State Requirements Notion database with regulatory facts per state.
 * Run once, then maintain manually in Notion.
 *
 * Usage:
 *   npx tsx scripts/populate-state-requirements.ts          # populate all seed data
 *   npx tsx scripts/populate-state-requirements.ts CA TX     # populate specific states
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DB_ID = process.env.NOTION_STATE_REQUIREMENTS_DB!;

if (!process.env.NOTION_TOKEN || !DB_ID) {
  console.error("Missing NOTION_TOKEN or NOTION_STATE_REQUIREMENTS_DB");
  process.exit(1);
}

const TODAY = new Date().toISOString().split("T")[0];

interface StateReqSeed {
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
  ticketOutcome: string;
  ticketOutcomeNote: string;
  eligibilityWindowMonths: number | null;
  certificateDelivery: string;
  courtFeeRequired: boolean;
  courtFeeNote: string;
  dmvLicenseRequired: boolean;
  licenseFormat: string;
  terminologyNotes: string;
  sourceUrl: string;
}

// ─── SEED DATA ─────────────────────────────────────────────

const SEEDS: StateReqSeed[] = [
  {
    stateCode: "CA",
    stateName: "California",
    officialTerm: "Traffic Violator School",
    approvalBody: "California Department of Motor Vehicles",
    approvalBodyShort: "CA DMV",
    mandatedHours: 8,
    hasFinalExam: true,
    examIsOpenBook: true,
    examAttemptsAllowed: 2,
    hasLessonTimers: false,
    ticketOutcome: "Masked",
    ticketOutcomeNote: "Ticket hidden from insurers — points masked on DMV record",
    eligibilityWindowMonths: 18,
    certificateDelivery: "Electronic to Court",
    courtFeeRequired: true,
    courtFeeNote: "Courts charge a non-refundable admin fee (varies by county, e.g. $52 in SF)",
    dmvLicenseRequired: true,
    licenseFormat: "E#### (e.g. E1854)",
    terminologyNotes: 'Use "mask" not "dismiss". Courts say "Traffic Violator School" but drivers say "traffic school" — use "traffic school" in copy. Never say "points dismissed".',
    sourceUrl: "https://www.dmv.ca.gov/portal/driver-education-and-safety/educational-courses/traffic-violator-school/",
  },
  {
    stateCode: "TX",
    stateName: "Texas",
    officialTerm: "Defensive Driving",
    approvalBody: "Texas Department of Licensing and Regulation",
    approvalBodyShort: "TDLR",
    mandatedHours: 6,
    hasFinalExam: true,
    examIsOpenBook: false,
    examAttemptsAllowed: 3,
    hasLessonTimers: true,
    ticketOutcome: "Dismissed",
    ticketOutcomeNote: "Ticket dismissed — keeps driving record clean",
    eligibilityWindowMonths: 12,
    certificateDelivery: "Electronic to Court",
    courtFeeRequired: true,
    courtFeeNote: "Court fee typically $10-$30 depending on county",
    dmvLicenseRequired: true,
    licenseFormat: "TDLR license number",
    terminologyNotes: '"Defensive driving" is the correct term for TX. TDLR-approved, not DMV. Course completion submitted to court.',
    sourceUrl: "https://www.tdlr.texas.gov/driver/drivertraining.htm",
  },
  {
    stateCode: "FL",
    stateName: "Florida",
    officialTerm: "Basic Driver Improvement",
    approvalBody: "Florida Department of Highway Safety and Motor Vehicles",
    approvalBodyShort: "FLHSMV",
    mandatedHours: 4,
    hasFinalExam: true,
    examIsOpenBook: true,
    examAttemptsAllowed: null, // unlimited
    hasLessonTimers: true,
    ticketOutcome: "Adjudication Withheld",
    ticketOutcomeNote: "Adjudication withheld — no points added to license. Citation remains on record but you are not formally convicted. Fine (minus ~18% reduction) must still be paid.",
    eligibilityWindowMonths: 12,
    certificateDelivery: "Electronic to Court",
    courtFeeRequired: true,
    courtFeeNote: "Driver must pay Clerk of Court an election fee (up to $18) plus reduced fine. Must elect within 30 days of citation. Varies by county.",
    dmvLicenseRequired: true,
    licenseFormat: "FLHSMV provider number",
    terminologyNotes: '"Basic Driver Improvement" or "BDI" is the official term. Do NOT call it "defensive driving". Outcome is "adjudication withheld" — do NOT say "ticket dismissed". FLHSMV-approved.',
    sourceUrl: "https://www.flhsmv.gov/driver-licenses-id-cards/education-courses/driver-improvement-schools/",
  },
  {
    stateCode: "AZ",
    stateName: "Arizona",
    officialTerm: "Defensive Driving",
    approvalBody: "Arizona Supreme Court",
    approvalBodyShort: "AZ Supreme Court",
    mandatedHours: null,
    hasFinalExam: false,
    examIsOpenBook: false,
    examAttemptsAllowed: null,
    hasLessonTimers: false,
    ticketOutcome: "Dismissed",
    ticketOutcomeNote: "Ticket dismissed — points not added to driving record",
    eligibilityWindowMonths: 24,
    certificateDelivery: "Electronic to Court",
    courtFeeRequired: false,
    courtFeeNote: "",
    dmvLicenseRequired: true,
    licenseFormat: "AZ Supreme Court approved",
    terminologyNotes: 'Use "dismiss" not "mask". AZ Supreme Court approved, not DMV. "Defensive driving" is the correct term.',
    sourceUrl: "https://www.azcourts.gov/selfservicecenter/Traffic/Defensive-Driving-School",
  },
  {
    stateCode: "OH",
    stateName: "Ohio",
    officialTerm: "Remedial Driving Instruction Course",
    approvalBody: "Ohio Department of Public Safety",
    approvalBodyShort: "Ohio DPS",
    mandatedHours: 8,
    hasFinalExam: true,
    examIsOpenBook: false,
    examAttemptsAllowed: 2,
    hasLessonTimers: true,
    ticketOutcome: "Reduced",
    ticketOutcomeNote: "2-point credit on driving record (raises suspension threshold from 12 to 14 points). Does NOT dismiss the ticket. Court diversion for dismissal is separate and at judge's discretion.",
    eligibilityWindowMonths: 36,
    certificateDelivery: "Electronic to BMV",
    courtFeeRequired: true,
    courtFeeNote: "If court-ordered diversion, court costs and diversion fee apply (varies by municipality). For voluntary 2-point credit, no court fee — only course fee.",
    dmvLicenseRequired: true,
    licenseFormat: "Ohio DPS DETS certified",
    terminologyNotes: '"Remedial Driving Instruction Course" or "Adult Remedial Course" is the official term. Do NOT say "traffic school" (CA/FL term). Ohio does NOT have statewide ticket dismissal via course — dismissal depends on local court diversion. Course must be completed within 30 days of enrollment.',
    sourceUrl: "https://www.bmv.ohio.gov/susp-other-points.aspx",
  },
  {
    stateCode: "VA",
    stateName: "Virginia",
    officialTerm: "Driver Improvement Clinic",
    approvalBody: "Virginia Department of Motor Vehicles",
    approvalBodyShort: "VA DMV",
    mandatedHours: 8,
    hasFinalExam: false,
    examIsOpenBook: false,
    examAttemptsAllowed: null,
    hasLessonTimers: false,
    ticketOutcome: "Reduced",
    ticketOutcomeNote: "Earn 5 safe driving points — may offset ticket points. Court may reduce/dismiss at discretion.",
    eligibilityWindowMonths: 24,
    certificateDelivery: "Electronic to DMV",
    courtFeeRequired: false,
    courtFeeNote: "",
    dmvLicenseRequired: true,
    licenseFormat: "VA DMV clinic number",
    terminologyNotes: '"Driver improvement clinic" is the official term. DMV-approved. Earns safe driving points rather than directly dismissing tickets.',
    sourceUrl: "https://www.dmv.virginia.gov/drivers/driver-improvement.html",
  },
  {
    stateCode: "NY",
    stateName: "New York",
    officialTerm: "Point and Insurance Reduction Program",
    approvalBody: "New York Department of Motor Vehicles",
    approvalBodyShort: "NY DMV",
    mandatedHours: 6,
    hasFinalExam: false,
    examIsOpenBook: false,
    examAttemptsAllowed: null,
    hasLessonTimers: false,
    ticketOutcome: "Reduced",
    ticketOutcomeNote: "Reduces up to 4 points on driving record + 10% auto insurance discount for 3 years",
    eligibilityWindowMonths: 18,
    certificateDelivery: "Electronic to DMV",
    courtFeeRequired: false,
    courtFeeNote: "",
    dmvLicenseRequired: true,
    licenseFormat: "PIRP sponsor number",
    terminologyNotes: '"PIRP" (Point and Insurance Reduction Program) is the official term. Also called "defensive driving" colloquially. Does not dismiss the ticket — reduces points.',
    sourceUrl: "https://dmv.ny.gov/tickets/point-insurance-reduction-program",
  },
  {
    stateCode: "NC",
    stateName: "North Carolina",
    officialTerm: "Defensive Driving",
    approvalBody: "North Carolina Division of Motor Vehicles",
    approvalBodyShort: "NC DMV",
    mandatedHours: null,
    hasFinalExam: false,
    examIsOpenBook: false,
    examAttemptsAllowed: null,
    hasLessonTimers: false,
    ticketOutcome: "Reduced",
    ticketOutcomeNote: "May reduce insurance points. Court-ordered in some cases. Does not remove DMV points directly.",
    eligibilityWindowMonths: null,
    certificateDelivery: "To Court",
    courtFeeRequired: false,
    courtFeeNote: "",
    dmvLicenseRequired: false,
    licenseFormat: "",
    terminologyNotes: "NC defensive driving is primarily for insurance point reduction. Check with your court for eligibility.",
    sourceUrl: "https://www.ncdot.gov/dmv/",
  },
  {
    stateCode: "NJ",
    stateName: "New Jersey",
    officialTerm: "Defensive Driving",
    approvalBody: "New Jersey Motor Vehicle Commission",
    approvalBodyShort: "NJ MVC",
    mandatedHours: 6,
    hasFinalExam: false,
    examIsOpenBook: false,
    examAttemptsAllowed: null,
    hasLessonTimers: false,
    ticketOutcome: "Reduced",
    ticketOutcomeNote: "Reduces 2 points from driving record + 5% insurance discount for 3 years. Does not dismiss the ticket.",
    eligibilityWindowMonths: null,
    certificateDelivery: "To MVC",
    courtFeeRequired: false,
    courtFeeNote: "",
    dmvLicenseRequired: true,
    licenseFormat: "NJ MVC approved",
    terminologyNotes: '"Defensive driving" or "accident prevention course". NJ MVC-approved. Point reduction, not ticket dismissal.',
    sourceUrl: "https://www.state.nj.us/mvc/drivertopics/defensivedriving.htm",
  },
  {
    stateCode: "WA",
    stateName: "Washington",
    officialTerm: "Defensive Driving",
    approvalBody: "Washington Department of Licensing",
    approvalBodyShort: "WA DOL",
    mandatedHours: null,
    hasFinalExam: false,
    examIsOpenBook: false,
    examAttemptsAllowed: null,
    hasLessonTimers: false,
    ticketOutcome: "Dismissed",
    ticketOutcomeNote: "Court may allow traffic school to dismiss or defer the ticket — at judge's discretion",
    eligibilityWindowMonths: null,
    certificateDelivery: "To Court",
    courtFeeRequired: false,
    courtFeeNote: "",
    dmvLicenseRequired: false,
    licenseFormat: "",
    terminologyNotes: "WA traffic school is at judge's discretion. Not all courts accept online courses. Confirm with your court before enrolling.",
    sourceUrl: "https://www.dol.wa.gov/",
  },
  {
    stateCode: "MI",
    stateName: "Michigan",
    officialTerm: "Basic Driver Improvement Course",
    approvalBody: "Michigan Secretary of State",
    approvalBodyShort: "MI SOS",
    mandatedHours: null,
    hasFinalExam: false,
    examIsOpenBook: false,
    examAttemptsAllowed: null,
    hasLessonTimers: false,
    ticketOutcome: "Reduced",
    ticketOutcomeNote: "May reduce points or fines at judge's discretion. Not a guaranteed dismissal.",
    eligibilityWindowMonths: null,
    certificateDelivery: "To Court",
    courtFeeRequired: false,
    courtFeeNote: "",
    dmvLicenseRequired: false,
    licenseFormat: "",
    terminologyNotes: '"Basic driver improvement course" is the official term. Court-ordered or voluntary. At judge\'s discretion.',
    sourceUrl: "https://www.michigan.gov/sos/",
  },
];

// ─── NOTION HELPERS ────────────────────────────────────────

function richText(text: string) {
  return { rich_text: [{ text: { content: text } }] };
}

function title(text: string) {
  return { title: [{ text: { content: text } }] };
}

function buildProperties(seed: StateReqSeed) {
  const props: Record<string, any> = {
    "State Code": title(seed.stateCode),
    "State Name": richText(seed.stateName),
    "Official Term": { select: { name: seed.officialTerm } },
    "Approval Body": richText(seed.approvalBody),
    "Approval Body Short": richText(seed.approvalBodyShort),
    "Has Final Exam": { checkbox: seed.hasFinalExam },
    "Exam Is Open Book": { checkbox: seed.examIsOpenBook },
    "Has Lesson Timers": { checkbox: seed.hasLessonTimers },
    "Ticket Outcome": { select: { name: seed.ticketOutcome } },
    "Ticket Outcome Note": richText(seed.ticketOutcomeNote),
    "Certificate Delivery": { select: { name: seed.certificateDelivery } },
    "Court Fee Required": { checkbox: seed.courtFeeRequired },
    "DMV License Required": { checkbox: seed.dmvLicenseRequired },
    "Last Verified": { date: { start: TODAY } },
  };

  if (seed.mandatedHours !== null) props["Mandated Hours"] = { number: seed.mandatedHours };
  if (seed.examAttemptsAllowed !== null) props["Exam Attempts Allowed"] = { number: seed.examAttemptsAllowed };
  if (seed.eligibilityWindowMonths !== null) props["Eligibility Window Months"] = { number: seed.eligibilityWindowMonths };
  if (seed.courtFeeNote) props["Court Fee Note"] = richText(seed.courtFeeNote);
  if (seed.licenseFormat) props["License Format"] = richText(seed.licenseFormat);
  if (seed.terminologyNotes) props["Terminology Notes"] = richText(seed.terminologyNotes);
  if (seed.sourceUrl) props["Source URL"] = { url: seed.sourceUrl };

  return props;
}

// ─── MAIN ──────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2).map(a => a.toUpperCase());
  const toSeed = args.length > 0
    ? SEEDS.filter(s => args.includes(s.stateCode))
    : SEEDS;

  if (toSeed.length === 0) {
    console.log("No matching states to seed.");
    return;
  }

  // Get existing rows to avoid duplicates
  console.log("Checking existing State Requirements...");
  const existing = new Map<string, string>();
  let cursor: string | undefined;
  do {
    const resp: any = await notion.databases.query({
      database_id: DB_ID,
      page_size: 100,
      start_cursor: cursor,
    });
    for (const page of resp.results) {
      const titleProp = (page as any).properties?.["State Code"];
      const code = titleProp?.title?.[0]?.plain_text ?? "";
      if (code) existing.set(code, page.id);
    }
    cursor = resp.has_more ? resp.next_cursor : undefined;
  } while (cursor);

  console.log(`Found ${existing.size} existing rows.\n`);
  console.log(`Seeding ${toSeed.length} states...\n`);

  for (const seed of toSeed) {
    const existingId = existing.get(seed.stateCode);

    if (existingId) {
      console.log(`  ${seed.stateCode} — updating existing row`);
      await notion.pages.update({
        page_id: existingId,
        properties: buildProperties(seed) as any,
      });
    } else {
      console.log(`  ${seed.stateCode} — creating new row`);
      await notion.pages.create({
        parent: { database_id: DB_ID },
        properties: buildProperties(seed) as any,
      });
    }

    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`\nDone. Seeded ${toSeed.length} state requirements.`);
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
