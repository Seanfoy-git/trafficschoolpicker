/**
 * School × state approval gate (25 Nov 2026).
 *
 * The state-card generator treated every school on a state page as approved for
 * that state's program, and the card printed a "{regulator}-approved" badge from
 * the STATE's record, not the school's. The 25 Nov audit (project doc
 * tsp-site-accuracy-audit-2026-11-25) found cards calling schools "DMV-approved"
 * where the school's own site says the opposite.
 *
 * data/school-state-approvals.json is written by scripts/check-school-approvals.ts
 * and records, per school card, what the evidence says (statuses explained there).
 * Rules applied here:
 *   1. A pair the school itself disclaims ("disclaimed") renders no card.
 *   2. Only a pair on the official list we hold ("listed") may say it is approved:
 *      the "-approved" badge, approval wording in the card copy, and the
 *      "-approved" phrase in its Product description. Every other pair, and any
 *      pair the check has never seen, makes no approval claim.
 *   3. A resold pair carries a con saying whose course it really is.
 *   4. On every card, not just comparison-layout pages: no star ratings or review
 *      counts in free text (the header shows the live ones) and no exam-attempt
 *      counts (state defaults the generator stamped onto every school).
 * Lines are dropped, never reworded, and each drop is logged so the Notion source
 * can be fixed.
 */
import data from "@/data/school-state-approvals.json";

export type ApprovalStatus = "disclaimed" | "resold" | "listed" | "claimed" | "court" | "unchecked";

type ApprovalPair = {
  school: string;
  state: string;
  status: ApprovalStatus;
  partner?: string;
  evidence: { kind: string; text: string; url: string }[];
  checked: string;
};

const PAIRS = (data as unknown as { pairs: Record<string, ApprovalPair> }).pairs;

/** Statuses whose card does not render. */
export const HIDDEN_APPROVAL_STATUSES: ReadonlySet<ApprovalStatus> = new Set<ApprovalStatus>(["disclaimed"]);

/** Display names for resale partners. */
const PARTNER_NAMES: Record<string, string> = { idrivesafely: "I Drive Safely" };

export function approvalFor(slug: string, stateCode: string): ApprovalPair | null {
  return PAIRS[`${slug}:${stateCode.toUpperCase()}`] ?? null;
}

export function isHiddenPair(slug: string, stateCode: string): boolean {
  const a = approvalFor(slug, stateCode);
  return !!a && HIDDEN_APPROVAL_STATUSES.has(a.status);
}

/** True only for a pair on the official list we hold. Unknown pairs claim nothing. */
export function mayClaimApproval(slug: string, stateCode: string): boolean {
  return approvalFor(slug, stateCode)?.status === "listed";
}

// "Approved by the New York DMV", "TDLR-approved", "state-approved", "widely-approved",
// "licensed by the California DMV", "Arizona Supreme Court approved", "Ohio-approved".
// Not "an approved course" or "not approved": those aren't claims about this school.
export const APPROVAL_CLAIM =
  /\b(?:approved|certified|licensed) by\b|\b(?!(?:an?|the|any|be|is|are|was|were|not|un|s|it|its)\b)[\w.]+[- ]approved\b|\bcourt[- ]accepted\b|\baccepted by all\b/i;
export const REVIEW_STAT =
  /\b\d[\d,]*\+?\s+(?:[A-Za-z]+\s+){0,2}reviews?\b|\b[1-5]\.\d\s*(?:\/\s*5\s*)?(?:-|\s)?(?:stars?|rating|trustpilot)\b/i;
export const EXAM_ATTEMPTS = /\b\d+ attempts?\b|\b(?:two|three) attempts\b|\bonly \d+ (?:tries|attempts)\b/i;

function dropReason(line: string, claimsOk: boolean): string | null {
  if (REVIEW_STAT.test(line)) return "review stat";
  if (EXAM_ATTEMPTS.test(line)) return "exam attempts";
  if (!claimsOk && APPROVAL_CLAIM.test(line)) return "unverified approval claim";
  return null;
}

/** Pros/cons lines a card may print for this pair. */
export function cardLinesFor(lines: string[], slug: string, stateCode: string, where: string): string[] {
  const claimsOk = mayClaimApproval(slug, stateCode);
  return lines.filter((l) => {
    const why = dropReason(l, claimsOk);
    if (why) console.warn(`[card-claims] ${where}: dropped "${l}" (${why})`);
    return !why;
  });
}

/** One-line take or best-for sentence(s): offending sentences dropped; null when nothing is left. */
export function cardTextFor(text: string | null, slug: string, stateCode: string, where: string): string | null {
  if (!text) return text;
  const claimsOk = mayClaimApproval(slug, stateCode);
  const sentences = text.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) ?? [text];
  const kept = sentences.filter((s) => {
    const why = dropReason(s, claimsOk);
    if (why) console.warn(`[card-claims] ${where}: dropped "${s.trim()}" (${why})`);
    return !why;
  });
  const out = kept.join("").trim();
  return out || null;
}

/** The disclosure a resold card must carry, or null. */
export function resaleConFor(slug: string, stateCode: string, schoolName: string): string | null {
  const a = approvalFor(slug, stateCode);
  if (a?.status !== "resold" || !a.partner) return null;
  const partner = PARTNER_NAMES[a.partner] ?? a.partner;
  return `This is ${partner}'s course, sold under the ${schoolName} name, so compare the two prices`;
}
