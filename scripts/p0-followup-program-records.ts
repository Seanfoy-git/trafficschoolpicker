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
 *  - V1 (round 2): Va. Code § 46.2-498(A) (12 demerit points in 12 months or 18 in 24 -> DMV-ordered clinic)
 *  - M1/M2 (round 2): RSMo § 302.302, version effective 28 Aug 2026: the course "shall be completed within
 *    sixty days of the date of conviction" https://revisor.mo.gov/main/OneSection.aspx?section=302.302
 */
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { APPLY, applyAll, assertWritable, changes, flags, fullText, getPage, notion, printPlan, richText, skips } from "./lib/notion-edit";
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

// V1 (round 2). Virginia True Cost: the three sentences after the 1d sentence.
const V1_OLD1 = "Course tuition typically runs $45 to $75.";
const V1_OLD2 = "Where the court allows dismissal, the return on a $75 course is roughly 24x against the avoided $1,700 surcharge.";
const V1_OLD3 = "Even where dismissal is unavailable, the 5-point safe-driving credit is one of the more generous point mechanisms in the country and materially helps carrier risk scoring at renewal.";
const V1_NEW =
  "If a judge dismisses the charge because you did a clinic, there's no conviction for your insurer to surcharge. If not, the clinic doesn't remove the conviction; its 5-point credit matters most if you're near the totals that make DMV order a clinic: 12 demerit points in 12 months, or 18 in 24 (Va. Code § 46.2-498(A)).";

// V2 (round 4). Virginia True Cost: delete, no replacement (no source; contradicts the V1 sentence before it).
const V2_OLD = "For a Virginia driver, the course is a strong move regardless of the exact court outcome.";

// M1 (round 2). Missouri Dismissal Answer: the whole field.
const MO_DISMISSAL_OLD = "No, no points added for that conviction";
const MO_DISMISSAL_NEW =
  "No. If the court orders it, finishing an approved eight-hour driver-improvement course within 60 days of your conviction means no points are assessed for that violation (RSMo § 302.302). The conviction still stands. Once in any 36 months; not for commercial-license holders or violations in a commercial vehicle.";

// M2 (round 2). Missouri's 60-day clock runs from the conviction.
const MO_PHRASE_OLD = "within 60 days of the violation";
const MO_PHRASE_NEW = "within 60 days of the conviction";
const MO_PHRASE_NEAR = /(60|sixty) days (of|from|after) (the )?(date of )?(the )?violation/gi;

// M3 (round 3, optional). Missouri intro: the last-checked date.
const MO_CHECKED_OLD = "Last checked September 2026.";
const MO_CHECKED_NEW = "Last checked October 2026.";

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

      // 1d, then V1 on the result; every True Cost change carries the final text (one write).
      const tc = fullText(page, "True Cost of a Ticket") ?? "";
      let tcText = tc;
      const tcChanges: typeof changes = [];
      const d1 = replaceOnce(tcText, VA_TRUE_COST_OLD, VA_TRUE_COST_NEW);
      if (d1 === null) skips.push({ db: DB, page: name, field: "True Cost of a Ticket (1d)", reason: "the reviewed OLD sentence is not in the field exactly once", found: tc });
      else { tcText = d1; tcChanges.push({ db: DB, page: name, pageId: info.id, field: "True Cost of a Ticket (1d)", current: VA_TRUE_COST_OLD, next: VA_TRUE_COST_NEW, property: {} }); }
      // V1 OLD 1: delete the sentence and the space before it.
      const o1 = replaceOnce(tcText, ` ${V1_OLD1}`, "") ?? replaceOnce(tcText, V1_OLD1, "");
      if (o1 === null) skips.push({ db: DB, page: name, field: "True Cost of a Ticket (V1, OLD 1)", reason: "OLD 1 is not in the field exactly once", found: tcText });
      else { tcText = o1.replace(/ +\n/g, "\n"); tcChanges.push({ db: DB, page: name, pageId: info.id, field: "True Cost of a Ticket (V1, delete OLD 1)", current: V1_OLD1, next: "(deleted)", property: {} }); }
      // V1 OLD 2 + OLD 3: replaced together, so they must be adjacent.
      const o23 = replaceOnce(tcText, `${V1_OLD2} ${V1_OLD3}`, V1_NEW);
      if (o23 === null) {
        const found = [V1_OLD2, V1_OLD3].map((x) => `${tcText.includes(x) ? "present" : "MISSING"}: ${x.slice(0, 50)}…`).join(" | ");
        skips.push({ db: DB, page: name, field: "True Cost of a Ticket (V1, OLD 2 + OLD 3)", reason: "OLD 2 followed by OLD 3 is not in the field exactly once", found: `${found} || field: ${tcText}` });
      } else { tcText = o23; tcChanges.push({ db: DB, page: name, pageId: info.id, field: "True Cost of a Ticket (V1, OLD 2 + OLD 3)", current: `${V1_OLD2} ${V1_OLD3}`, next: V1_NEW, property: {} }); }
      // V2: delete the sentence and the space before it.
      const v2 = replaceOnce(tcText, ` ${V2_OLD}`, "") ?? replaceOnce(tcText, V2_OLD, "");
      if (v2 === null) skips.push({ db: DB, page: name, field: "True Cost of a Ticket (V2)", reason: "the V2 sentence is not in the field exactly once", found: tcText });
      else { tcText = v2.replace(/ +\n/g, "\n").trimEnd(); tcChanges.push({ db: DB, page: name, pageId: info.id, field: "True Cost of a Ticket (V2, delete)", current: V2_OLD, next: "(deleted)", property: {} }); }
      for (const c of tcChanges) c.property = { "True Cost of a Ticket": { rich_text: richText(tcText) } };
      changes.push(...tcChanges);
      if (tcChanges.length) console.log(`INFO    Virginia True Cost after 1d, V1 and V2:\n${tcText}\n`);

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

  await missouri();
  const blockChanges = await questionPages();

  printPlan("P0 follow-up Task 1: Virginia and New Jersey program records; Missouri (round 2)");
  for (const b of blockChanges) {
    console.log(`CHANGE  Question Pages > ${b.page} > block ${b.blockId} (${b.type})`);
    console.log(`  current: ${JSON.stringify(b.before)}`);
    console.log(`  new:     ${JSON.stringify(b.after)}\n`);
  }
  if (blockChanges.length) console.log(`${blockChanges.length} Question Pages block change(s).`);
  // FAQ changes that share one field write carry an empty payload; applyAll merges each page's payloads into one write.
  await applyAll();
  if (APPLY && blockChanges.length) {
    if (!changes.length) await assertWritable(blockChanges[0].pageId);
    for (const b of blockChanges) {
      await notion.blocks.update({ block_id: b.blockId, [b.type]: { rich_text: b.richText } } as never);
      console.log(`  ✓ wrote Question Pages > ${b.page} > block ${b.blockId}`);
      await new Promise((r) => setTimeout(r, 350));
    }
  }
  if (APPLY) console.log("\nApplied. Rebuild and check /virginia, /new-jersey, /missouri and the regenerated llms files.");
}

main().catch((e) => { console.error(e); process.exit(1); });

/** M1 + M2 on Missouri's canonical States row. */
async function missouri() {
  const info = await getStateInfo("MO");
  if (!info) { skips.push({ db: DB, page: "MO", field: "(row)", reason: "no canonical States row", found: "" }); return; }
  const page = await getPage(info.id);
  const name = `${info.name} (MO, page ${info.id})`;

  // M1
  const da = fullText(page, "Dismissal Answer") ?? "";
  if (da === MO_DISMISSAL_OLD) changes.push({ db: DB, page: name, pageId: info.id, field: "Dismissal Answer", current: da, next: MO_DISMISSAL_NEW, property: { "Dismissal Answer": { rich_text: richText(MO_DISMISSAL_NEW) } } });
  else skips.push({ db: DB, page: name, field: "Dismissal Answer", reason: `current text is not ${JSON.stringify(MO_DISMISSAL_OLD)}`, found: da });

  // M2: every text field on the row (M3 too, on the intro: one write of the final text).
  for (const [field, prop] of Object.entries(page.properties)) {
    if (prop.type !== "rich_text" && prop.type !== "title") continue;
    if (field === "Dismissal Answer") continue; // M1 replaces the whole field
    const text = fullText(page, field) ?? "";
    const n = text.split(MO_PHRASE_OLD).length - 1;
    let next = n > 0 ? text.split(MO_PHRASE_OLD).join(MO_PHRASE_NEW) : text;
    const fieldChanges: typeof changes = [];
    if (n > 0) fieldChanges.push({ db: DB, page: name, pageId: info.id, field: `${field} (M2, ${n} hit${n > 1 ? "s" : ""})`, current: excerpt(text, MO_PHRASE_OLD), next: excerpt(next, MO_PHRASE_NEW), property: {} });
    if (field === "Intro Paragraph") {
      const m3 = replaceOnce(next, MO_CHECKED_OLD, MO_CHECKED_NEW);
      if (m3 === null) skips.push({ db: DB, page: name, field: "Intro Paragraph (M3)", reason: `${JSON.stringify(MO_CHECKED_OLD)} is not in the field exactly once`, found: text.match(/Last (checked|verified)[^.]*\./i)?.[0] ?? text.slice(-160) });
      else { next = m3; fieldChanges.push({ db: DB, page: name, pageId: info.id, field: "Intro Paragraph (M3)", current: MO_CHECKED_OLD, next: MO_CHECKED_NEW, property: {} }); }
    }
    for (const c of fieldChanges) c.property = { [field]: prop.type === "title" ? { title: richText(next) } : { rich_text: richText(next) } };
    changes.push(...fieldChanges);
    for (const m of text.replaceAll(MO_PHRASE_OLD, "").matchAll(MO_PHRASE_NEAR)) flags.push({ db: DB, page: name, field, note: "a near variant of the phrase; not changed", found: excerpt(text, m[0]) });
  }

  // Legacy FAQ DB (not rendered for Missouri, which has a State FAQ): report only.
  if (process.env.NOTION_FAQ_DB_ID) {
    const rows = await queryAll(process.env.NOTION_FAQ_DB_ID);
    for (const r of rows) for (const field of Object.keys(r.properties)) {
      const t = fullText(r, field) ?? "";
      if (t.includes(MO_PHRASE_OLD) || /60 days of the violation/i.test(t)) flags.push({ db: "State FAQ Facts (legacy FAQ DB)", page: `${titleOf(r)} (page ${r.id})`, field, note: "legacy FAQ DB, not rendered where a State FAQ exists; not changed", found: excerpt(t, "60 days of the violation") });
    }
  }
}

type BlockChange = { page: string; pageId: string; blockId: string; type: string; before: string; after: string; richText: unknown[] };

/** M2 across the Question Pages DB: properties and page blocks. Missouri pages are changed; any other state's hit is flagged. */
async function questionPages(): Promise<BlockChange[]> {
  const out: BlockChange[] = [];
  const db = process.env.NOTION_QUESTIONS_DB;
  if (!db) { flags.push({ db: "Question Pages", page: "-", field: "-", note: "NOTION_QUESTIONS_DB not set; not searched", found: "" }); return out; }
  for (const page of await queryAll(db)) {
    const isMO = (fullText(page, "State Code") ?? "").trim().toUpperCase() === "MO" || (fullText(page, "State Slug") ?? "").trim() === "missouri";
    const name = `${titleOf(page)} [${fullText(page, "State Slug") ?? "?"}] (page ${page.id})`;
    for (const [field, prop] of Object.entries(page.properties)) {
      if (prop.type !== "rich_text" && prop.type !== "title") continue;
      const text = fullText(page, field) ?? "";
      if (!text.includes(MO_PHRASE_OLD)) continue;
      if (!isMO) { flags.push({ db: "Question Pages", page: name, field, note: "not a Missouri page; not changed", found: excerpt(text, MO_PHRASE_OLD) }); continue; }
      const next = text.split(MO_PHRASE_OLD).join(MO_PHRASE_NEW);
      changes.push({ db: "Question Pages", page: name, pageId: page.id, field: `${field} (M2)`, current: excerpt(text, MO_PHRASE_OLD), next: excerpt(next, MO_PHRASE_NEW), property: { [field]: prop.type === "title" ? { title: richText(next) } : { rich_text: richText(next) } } });
    }
    // Blocks (one level of children too, for list items).
    const stack: string[] = [page.id];
    while (stack.length) {
      const parent = stack.shift()!;
      let cursor: string | undefined;
      do {
        const r = await notion.blocks.children.list({ block_id: parent, start_cursor: cursor, page_size: 100 });
        for (const b of r.results as Array<Record<string, unknown> & { id: string; type: string; has_children?: boolean }>) {
          if (b.has_children && parent === page.id) stack.push(b.id);
          const body = b[b.type] as { rich_text?: Array<{ plain_text: string; type: string; text?: { content: string; link: unknown } }> } | undefined;
          const rt = body?.rich_text;
          if (!rt?.length) continue;
          const whole = rt.map((x) => x.plain_text).join("");
          if (!whole.includes(MO_PHRASE_OLD)) continue;
          if (!isMO) { flags.push({ db: "Question Pages", page: name, field: `block ${b.id}`, note: "not a Missouri page; not changed", found: excerpt(whole, MO_PHRASE_OLD) }); continue; }
          // Replace inside the text segment(s) that hold the whole phrase, keeping each segment's annotations and link.
          let ok = true;
          const next = rt.map((seg) => {
            if (seg.type !== "text" || !seg.text) return seg;
            if (!seg.text.content.includes(MO_PHRASE_OLD)) return seg;
            const content = seg.text.content.split(MO_PHRASE_OLD).join(MO_PHRASE_NEW);
            return { ...seg, text: { ...seg.text, content }, plain_text: content };
          });
          if (next.map((x) => (x as { plain_text: string }).plain_text).join("").includes(MO_PHRASE_OLD)) ok = false;
          if (!ok) { skips.push({ db: "Question Pages", page: name, field: `block ${b.id}`, reason: "the phrase spans formatting segments; not changed", found: excerpt(whole, MO_PHRASE_OLD) }); continue; }
          // The API takes {type, text, annotations} segments; plain_text/href are read-only.
          const payload = next.map((x) => { const { plain_text: _p, href: _h, ...rest } = x as Record<string, unknown>; void _p; void _h; return rest; });
          out.push({ page: name, pageId: page.id, blockId: b.id, type: b.type, before: excerpt(whole, MO_PHRASE_OLD), after: excerpt(next.map((x) => (x as { plain_text: string }).plain_text).join(""), MO_PHRASE_NEW), richText: payload });
        }
        cursor = r.has_more ? (r.next_cursor ?? undefined) : undefined;
      } while (cursor);
    }
  }
  return out;
}

async function queryAll(dbId: string): Promise<PageObjectResponse[]> {
  const out: PageObjectResponse[] = [];
  let cursor: string | undefined;
  do {
    const r = await notion.databases.query({ database_id: dbId, start_cursor: cursor, page_size: 100 });
    out.push(...(r.results as PageObjectResponse[]));
    cursor = r.has_more ? (r.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return out;
}
const titleOf = (p: PageObjectResponse) => {
  const t = Object.entries(p.properties).find(([, v]) => v.type === "title")?.[0];
  return (t && fullText(p, t)) || p.id;
};
/** ~100 characters around the first occurrence of `needle`. */
function excerpt(text: string, needle: string): string {
  const i = text.indexOf(needle);
  if (i < 0) return text.slice(0, 160);
  return `${i > 60 ? "…" : ""}${text.slice(Math.max(0, i - 60), i + needle.length + 60)}${i + needle.length + 60 < text.length ? "…" : ""}`;
}
