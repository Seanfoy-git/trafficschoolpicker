/**
 * P0 follow-up, Task 1 (30 Oct 2026): Virginia and New Jersey program records
 * on the States DB. Wording reviewed by Sean; the law is checked.
 *
 *   npx tsx scripts/p0-followup-program-records.ts           # DRY RUN: prints every change, writes nothing
 *   npx tsx scripts/p0-followup-program-records.ts --apply   # writes (stops if the token can't write)
 *
 * Pages are the canonical States rows the site renders (getStateInfo). Each
 * change is made only when the current text matches the reviewed text; a
 * mismatch is SKIPPED and reported with the text found, never improvised.
 *
 * Sources:
 *  - Va. Code § 46.2-498(C)-(D) https://law.lis.virginia.gov/vacode/title46.2/chapter3/section46.2-498/
 *  - Va. Code § 46.2-505 (court use of a clinic; CDL bar in (B)); § 19.2-298.02 (deferred disposition);
 *    § 38.2-2217(B) (insurer reduction)
 *  - NJ MVC driver programs https://www.nj.gov/mvc/license/driverprograms.htm
 */
import { APPLY, applyAll, changes, fullText, getPage, printPlan, richText, skips } from "./lib/notion-edit";
import { getStateInfo } from "../lib/notion";

const DB = "States DB";

// 1b. Online Model: both states resolve to "Online — insurance discount only" today.
const ONLINE_MODEL = "Point reduction";

// 1c. Virginia Dismissal Answer: the whole field.
const VA_DISMISSAL =
  "Not by itself. The clinic earns a 5-point credit or, if your insurer offers one, a premium reduction. You choose one, once every two years. Virginia law bars a judge from reducing or dismissing a charge because of a clinic only for CDL holders and commercial-vehicle offenses (Va. Code § 46.2-505(B)); for everyone else it's the judge's call.";

// 1d. Virginia True Cost of a Ticket: one sentence.
const VA_TRUE_COST_OLD =
  "Virginia's Driver Improvement Clinic (Va. Code §§ 46.2-489 and 46.2-498) allows either dismissal (court-discretionary) or a 5 safe-driving-point credit, available once every 24 months.";
const VA_TRUE_COST_NEW =
  "Virginia's Driver Improvement Clinic (Va. Code § 46.2-498) earns a 5-point credit or an insurance reduction, your choice, once every two years. It does not dismiss the ticket; whether a judge takes it into account is up to the court (Va. Code § 46.2-505).";

// 1e. Virginia Lawyer Block disqualifier (also changed in scripts/populate-lawyer-block.ts).
export const VA_DISQUALIFIER_OLD =
  "The Virginia course earns safe driving points or an insurance discount. It never dismisses a ticket, and reckless driving by speed is a criminal charge in Virginia. That charge needs a lawyer, not a course.";
export const VA_DISQUALIFIER_NEW =
  "The Virginia course earns a 5-point credit or an insurance discount. It doesn't dismiss a ticket on its own, and reckless driving by speed is a criminal charge in Virginia. That charge needs a lawyer, not a course.";

// 1f. Virginia State FAQ: answers replaced, matched on the exact question.
const VA_FAQ: Record<string, string> = {
  "Does Virginia driver improvement dismiss my ticket?":
    "Not by itself. A DMV-approved clinic earns a 5-point credit or an insurance reduction (you choose one when you enroll, not both), once every two years. Virginia law bars a judge from reducing or dismissing a charge because of a clinic only for CDL holders and commercial-vehicle offenses, so for everyone else it's the court's call. For a criminal charge such as reckless driving, the court can also defer the case and dismiss it later on conditions, with the prosecutor's agreement (deferred disposition). Va. Code §§ 46.2-498, 46.2-505, 19.2-298.02. Last checked October 2026.",
  "Who submits my certificate in Virginia?":
    "Your school submits completion to the Virginia DMV, which applies the point credit if you chose points. If you chose the insurance reduction instead, you send the certificate to your insurer. You get one or the other, not both.",
  "Can I do Virginia driver improvement online?":
    "Yes. Virginia DMV says a clinic can be completed online or in person. Online, the course and the final test must both go through a DMV-licensed online provider. If a court ordered your clinic, the court decides whether you get the point credit.",
  "How often can I do Virginia driver improvement?":
    "Once every two years for the benefit you chose, the point credit or the insurance reduction (Va. Code § 46.2-498(C)). You can take a clinic again after one year to get the other one. Insurers may give a reduction for two years to drivers 54 or younger; they don't have to, and drivers sent by a court or DMV don't qualify (Va. Code § 38.2-2217(B)).",
};

// 1g. New Jersey State FAQ: one sentence in one answer.
const NJ_FAQ_Q = "How often can I take the New Jersey course?";
const NJ_FAQ_OLD = "The 2-point reduction is available once every five years.";
const NJ_FAQ_NEW = "The 2-point reduction is available once every five years, and only if you have points on your record when you finish the course.";

/** A JSON string literal's body, as it appears inside the raw field. */
const jsonBody = (s: string) => JSON.stringify(s).slice(1, -1);

function replaceOnce(raw: string, oldS: string, newS: string): string | null {
  const i = raw.indexOf(oldS);
  if (i < 0 || raw.indexOf(oldS, i + 1) >= 0) return null;
  return raw.slice(0, i) + newS + raw.slice(i + oldS.length);
}

type FaqEntry = { q?: string; a?: string; question?: string; answer?: string };
function parseFaq(raw: string): FaqEntry[] | null {
  try {
    const parsed = JSON.parse(raw.trim().replace(/^faqjson:\s*/i, ""));
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function main() {
  if (!process.env.NOTION_TOKEN) throw new Error("NOTION_TOKEN not set (.env.local)");
  for (const code of ["VA", "NJ"] as const) {
    const info = await getStateInfo(code);
    if (!info) {
      skips.push({ db: DB, page: code, field: "(row)", reason: "no canonical States row", found: "" });
      continue;
    }
    const page = await getPage(info.id);
    const name = `${info.name} (${code}, page ${info.id})`;

    // 1b
    const model = fullText(page, "Online Model") ?? "";
    if (info.onlineStatus !== "Online — insurance discount only") {
      skips.push({ db: DB, page: name, field: "Online Model", reason: `resolves to "${info.onlineStatus}", not "Online — insurance discount only" as reviewed`, found: model });
    } else {
      changes.push({ db: DB, page: name, pageId: info.id, field: "Online Model", current: model || "(empty: status from the checkboxes, Online — insurance discount only)", next: ONLINE_MODEL, property: { "Online Model": { select: { name: ONLINE_MODEL } } } });
    }

    if (code === "VA") {
      // 1c
      const da = fullText(page, "Dismissal Answer") ?? "";
      changes.push({ db: DB, page: name, pageId: info.id, field: "Dismissal Answer", current: da, next: VA_DISMISSAL, property: { "Dismissal Answer": { rich_text: richText(VA_DISMISSAL) } } });

      // 1d
      const tc = fullText(page, "True Cost of a Ticket") ?? "";
      const tcNew = replaceOnce(tc, VA_TRUE_COST_OLD, VA_TRUE_COST_NEW);
      if (tcNew === null) skips.push({ db: DB, page: name, field: "True Cost of a Ticket", reason: "the reviewed OLD sentence is not in the field exactly once", found: tc });
      else changes.push({ db: DB, page: name, pageId: info.id, field: "True Cost of a Ticket", current: VA_TRUE_COST_OLD, next: VA_TRUE_COST_NEW, property: { "True Cost of a Ticket": { rich_text: richText(tcNew) } } });

      // 1e: edited inside the raw JSON so firms and every other key stay byte-for-byte.
      const lb = fullText(page, "Lawyer Block") ?? "";
      let lbParsed: { disqualifier?: string } | null = null;
      try { lbParsed = JSON.parse(lb.trim().replace(/^lawyerblock:\s*/i, "")); } catch { /* reported below */ }
      const lbNew = lbParsed?.disqualifier === VA_DISQUALIFIER_OLD ? replaceOnce(lb, jsonBody(VA_DISQUALIFIER_OLD), jsonBody(VA_DISQUALIFIER_NEW)) : null;
      if (lbNew === null) skips.push({ db: DB, page: name, field: "Lawyer Block (disqualifier)", reason: "disqualifier is not the reviewed OLD text", found: lbParsed?.disqualifier ?? lb });
      else changes.push({ db: DB, page: name, pageId: info.id, field: "Lawyer Block (disqualifier)", current: VA_DISQUALIFIER_OLD, next: VA_DISQUALIFIER_NEW, property: { "Lawyer Block": { rich_text: richText(lbNew) } } });

      // 1f
      const faqRaw = fullText(page, "State FAQ") ?? "";
      const faq = parseFaq(faqRaw);
      let faqNew = faqRaw;
      for (const [q, a] of Object.entries(VA_FAQ)) {
        const e = faq?.find((x) => (x.q ?? x.question) === q);
        const oldA = e ? (e.a ?? e.answer ?? "") : null;
        const replaced = oldA !== null ? replaceOnce(faqNew, jsonBody(oldA), jsonBody(a)) : null;
        if (oldA === null || replaced === null) {
          skips.push({ db: DB, page: name, field: `State FAQ: "${q}"`, reason: oldA === null ? "question not found exactly" : "answer not found exactly once in the raw JSON", found: oldA ?? (faq?.map((x) => x.q ?? x.question).join(" / ") ?? faqRaw.slice(0, 300)) });
          continue;
        }
        faqNew = replaced;
        changes.push({ db: DB, page: name, pageId: info.id, field: `State FAQ: "${q}"`, current: oldA, next: a, property: {} });
      }
      if (faqNew !== faqRaw) {
        // All FAQ answers go in one write of the whole field (attached to the last FAQ change).
        const last = [...changes].reverse().find((c) => c.pageId === info.id && c.field.startsWith("State FAQ"));
        if (last) last.property = { "State FAQ": { rich_text: richText(faqNew) } };
        if (parseFaq(faqNew) === null) throw new Error("rewritten VA State FAQ is not valid JSON; aborting");
      }
    }

    if (code === "NJ") {
      // 1g
      const faqRaw = fullText(page, "State FAQ") ?? "";
      const faq = parseFaq(faqRaw);
      const e = faq?.find((x) => (x.q ?? x.question) === NJ_FAQ_Q);
      const oldA = e ? (e.a ?? e.answer ?? "") : null;
      const newA = oldA !== null ? replaceOnce(oldA, NJ_FAQ_OLD, NJ_FAQ_NEW) : null;
      const faqNew = oldA !== null && newA !== null ? replaceOnce(faqRaw, jsonBody(oldA), jsonBody(newA)) : null;
      if (faqNew === null || newA === null) {
        skips.push({ db: DB, page: name, field: `State FAQ: "${NJ_FAQ_Q}"`, reason: oldA === null ? "question not found exactly" : "the reviewed OLD sentence is not in the answer exactly once", found: oldA ?? (faq?.map((x) => x.q ?? x.question).join(" / ") ?? "") });
      } else {
        if (parseFaq(faqNew) === null) throw new Error("rewritten NJ State FAQ is not valid JSON; aborting");
        changes.push({ db: DB, page: name, pageId: info.id, field: `State FAQ: "${NJ_FAQ_Q}"`, current: oldA!, next: newA, property: { "State FAQ": { rich_text: richText(faqNew) } } });
      }
    }
  }

  printPlan("P0 follow-up Task 1: Virginia and New Jersey program records");
  // FAQ changes that share one field write carry an empty payload; applyAll merges each page's payloads into one write.
  await applyAll();
  if (APPLY) console.log("\nApplied. Rebuild and check /virginia, /new-jersey and the regenerated llms files.");
}

main().catch((e) => { console.error(e); process.exit(1); });
