/**
 * Page-contradiction guard (postbuild). P10 Task 6.
 *
 * Phase 1 gave each state page a model-derived "Key Facts" <dl> (dismissal
 * mechanism, course length, certificate submitter). That new, authoritative
 * summary sits ABOVE the state's old FAQ prose — and until every state's FAQ is
 * reconciled (P10 Task 2/3), the old copy can still assert the opposite of the
 * new Key Facts on the same page. That is a silent regression: the page looks
 * authoritative while contradicting itself, and both the visible FAQ and its
 * FAQPage JSON-LD feed Google / AI Overviews.
 *
 * This guard turns that class of drift into a red build. For each built state
 * page it reads the rendered Key Facts <dl> and the FAQPage JSON-LD (the two
 * machine-read surfaces) and fails when a single page gives two answers to the
 * same question:
 *
 *   (a) DISMISSAL polarity — the Key Facts dismissal value vs the answers to
 *       DISMISSAL questions: a clear "yes, it dismisses" alongside a clear "no /
 *       court-by-court / point credit / insurance only". "Court-by-court" as the
 *       Key Facts value is neutral, not a Yes. A "does it erase" or "can I take it
 *       online" answer is a different question and never counts.
 *   (b) COURSE LENGTH — a "how long" answer names an hour value that differs from
 *       the Key Facts course length, outside a labeled secondary program
 *       (mature-driver / mandatory / a "separate" / "also runs" course).
 *   (c) FREQUENCY — the Key Facts eligibility states one "once every/per …" window
 *       while a FAQ answer states a different one (record-vs-FAQ drift).
 *   (d) SUBMITTER — Key Facts says the driver files the certificate while the FAQ
 *       says the school/clinic files it with the court/DMV, or vice versa. A
 *       downstream "the court then reports to the DMV" step is not a submitter
 *       answer, and a genuinely court-dependent FAQ that names both parties passes.
 *
 * It also greps every built page for the two P13 template-join signatures
 * (a lowercase letter fused onto "but your license" / "Traffic School Rules"),
 * which mark a missing space/period from a string join.
 *
 * Same discipline as the other verify-* gates: assert the invariant, fail loudly
 * on regression, fix at the source (the state's FAQ / record), not the built file.
 *
 *   npx tsx scripts/verify-page-contradictions.ts [buildDir]
 *     buildDir defaults to .next/server/app
 */
import fs from "fs";
import path from "path";
import { getAllStateSlugs } from "../lib/state-utils";

// ---------- html helpers ----------

function htmlUnescape(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** Key Facts <dl> label to value pairs from the rendered page. */
function keyFacts(html: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /<dt[^>]*>([^<]+)<\/dt>\s*<dd[^>]*>([^<]*)<\/dd>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    out[htmlUnescape(m[1]).trim()] = htmlUnescape(m[2]).trim();
  }
  return out;
}

/** FAQ question/answer pairs from the FAQPage JSON-LD (the surface Google / LLMs read). */
type Faq = { q: string; a: string };
function faqEntries(html: string): Faq[] {
  const out: Faq[] = [];
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    if (!m[1].includes("FAQPage")) continue;
    try {
      const j = JSON.parse(htmlUnescape(m[1]));
      for (const e of j.mainEntity ?? []) {
        const q = e?.name;
        const a = e?.acceptedAnswer?.text;
        if (typeof q === "string" && typeof a === "string") out.push({ q, a });
      }
    } catch {
      /* a malformed FAQPage is caught by the prebuild FAQ-integrity gate */
    }
  }
  return out;
}

// ---------- polarity / value predicates ----------

// A clear affirmative that the course DISMISSES the ticket. Conditional phrasing
// ("with court permission you may be able to dismiss") is deliberately NOT a Yes.
const yesDismiss = (a: string) =>
  /^\s*yes\b/i.test(a) ||
  /\bdismisses (?:your|the|an?|eligible)\b/i.test(a) ||
  /\bgets? your ticket dismissed\b/i.test(a) ||
  /\bhave (?:your|the) ticket dismissed\b/i.test(a);

// A clear negative: no dismissal, a point-credit / insurance program instead, or a
// "no statewide program / court-by-court / judge's discretion" answer (a No to
// "does a course dismiss my ticket statewide", not a Yes).
const noDismiss = (a: string) =>
  /^\s*(no\b|not\b|there is no\b|sometimes\b|possibly\b)/i.test(a) ||
  /\bdoes not dismiss\b|\bcannot dismiss\b|\bwon'?t dismiss\b|\bnot (?:on its own|by itself|automatic)\b/i.test(a) ||
  /\bno statewide\b|\bpoint credit instead\b|\binsurance discount only\b|\bcourt[- ]by[- ]court\b|\bcourt(?:'s)? discretion\b|\bat (?:the )?discretion of\b|\bjudge[- ]driven\b/i.test(a);

// The value the Key Facts "Ticket dismissal" row shows for a state that makes NO
// affirmative dismissal claim — neutral, so it never conflicts with a No.
const kfDismissNeutral = (v: string) =>
  /court[- ]by[- ]court|via a court program|court discretion/i.test(v);

/** Distinct hour values in a blob, ignoring ranges ("4 to 4.5 hours" = one hit).
 *  Each hit is tagged secondary when it sits next to a label marking a DIFFERENT
 *  course (mature-driver, mandatory, a "separate" / "also runs" program), which is
 *  excluded from the primary course-length comparison. */
type HourHit = { value: number; secondary: boolean };
function hourHits(blob: string): HourHit[] {
  const hits: HourHit[] = [];
  const re = /(\d+(?:\.\d+)?)\s*(?:(?:to|through|-|and)\s*\d+(?:\.\d+)?\s*)?[- ]?hours?\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(blob))) {
    const around = blob.slice(Math.max(0, m.index - 120), m.index + m[0].length + 120);
    const secondary =
      /\b(mature|55\+|senior|invitation|refresher|mandatory|dui|advanced|remedial|assigned|survival|intermediate|super speeder)\b/i.test(around) ||
      /\b(separate|also (?:runs|offers|has)|do not confuse|different course)\b/i.test(around);
    hits.push({ value: parseFloat(m[1]), secondary });
  }
  return hits;
}

/** Normalize a "once every/per N unit" frequency window to a month count (or "lifetime"). */
function freqWindows(blob: string): Set<string> {
  const out = new Set<string>();
  if (/once\s+(?:per|in any|within)?\s*(?:in a )?lifetime/i.test(blob)) out.add("lifetime");
  const re = /once\s+(?:every|per|in any|within(?:\s+any)?|each)\s+(?:(\d+)[- ])?(month|year)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(blob))) {
    const n = m[1] ? parseInt(m[1], 10) : 1;
    const months = m[2].toLowerCase().startsWith("year") ? n * 12 : n;
    out.add(`${months}mo`);
  }
  return out;
}

// The DRIVER files the certificate. Covers both "you submit …" and the common
// "you receive a certificate and submit it to your court yourself / who must then
// submit it" constructions where the driver is the (sometimes implied) subject.
const driverSubmits = (a: string) =>
  /\b(?:you|the driver|driver|defendant)\s+(?:must\s+)?(?:submit|present|mail|file|turn in)\b/i.test(a) ||
  /\bdriver submits\b/i.test(a) ||
  /\byou submit\b/i.test(a) ||
  /\b(?:and|then|must then)\s+submit it\b[^.]{0,40}\b(?:court|dmv|insurer|insurance|yourself)\b/i.test(a) ||
  /\bmailed to (?:the )?driver\b/i.test(a);

// The school/clinic/provider files the certificate WITH the court/DMV on the
// driver's behalf. The submit-verb must bind directly to the school noun (0-2
// words between), so "you receive it from your provider … and submit it" (the
// DRIVER submitting) and a downstream "the court reports to the DMV" do not match.
const schoolSubmitsToAgency = (a: string) =>
  /\b(?:school|clinic|provider|course|approved school)\s+(?:\w+\s+){0,2}(?:submits?|reports?|sends?|files?|transmits?|notif(?:ies|y))\b[^.]{0,60}\b(?:court|dmv|mvd|dps|secretary of state|state|electronically)\b/i.test(a) ||
  /\bon your behalf\b/i.test(a);

// ---------- per-page scan ----------

const P13_JOINS = [/[a-z]but your license/, /[a-z]Traffic School Rules/];

function scanState(html: string): string[] {
  const problems: string[] = [];
  const kf = keyFacts(html);
  const faqs = faqEntries(html);

  // (a) DISMISSAL polarity — Key Facts value vs the answers to DISMISSAL questions.
  const kfDismiss = kf["Ticket dismissal"] ?? "";
  const dismissAnswers = faqs.filter((f) => /dismiss/i.test(f.q)).map((f) => f.a);
  const dismissClaims = [
    ...(kfDismiss && !kfDismissNeutral(kfDismiss) ? [kfDismiss] : []),
    ...dismissAnswers,
  ];
  const y = dismissClaims.find(yesDismiss);
  const n = dismissClaims.find(noDismiss);
  if (y && n && y !== n) {
    problems.push(`dismissal double-answer — YES: "${y.slice(0, 70)}" vs NO: "${n.slice(0, 70)}"`);
  }

  // (b) COURSE LENGTH — a "how long" answer names an hour value that differs from
  // the Key Facts course length, outside a labeled secondary program.
  const kfLen = kf["Course length"] ?? "";
  const kfHours = new Set(hourHits(kfLen).map((h) => h.value));
  if (kfHours.size) {
    const lengthAnswers = faqs.filter((f) => /how long|length|hours|minutes/i.test(f.q)).map((f) => f.a);
    const faqHours = hourHits(lengthAnswers.join("     "))
      .filter((h) => !h.secondary && !kfHours.has(h.value))
      .map((h) => h.value);
    if (faqHours.length) {
      problems.push(
        `course-length double-answer — Key Facts "${kfLen}" vs FAQ ${[...new Set(faqHours)].join("/")} hour(s)`
      );
    }
  }

  // (c) FREQUENCY — Key Facts eligibility window vs a different FAQ window.
  const kfWindows = freqWindows(kf["Eligibility"] ?? "");
  if (kfWindows.size === 1) {
    const kfW = [...kfWindows][0];
    const faqW = new Set<string>();
    for (const f of faqs) for (const w of freqWindows(f.a)) faqW.add(w);
    const conflict = [...faqW].find((w) => w !== kfW);
    if (conflict) problems.push(`frequency double-answer — Key Facts ${kfW} vs FAQ ${conflict}`);
  }

  // (d) SUBMITTER — Key Facts names one party, the FAQ names the other (and does
  // not also name the Key Facts party, which would just be court-dependent nuance).
  const kfSubmit = kf["Certificate submission"] ?? "";
  if (kfSubmit) {
    const kfDriver = /driver submits|you submit/i.test(kfSubmit);
    const kfSchool = /school submits|clinic|provider submits/i.test(kfSubmit);
    const faqDriver = faqs.some((f) => driverSubmits(f.a));
    const faqSchool = faqs.some((f) => schoolSubmitsToAgency(f.a));
    if (kfDriver && faqSchool && !faqDriver) {
      problems.push(`submitter double-answer — Key Facts "${kfSubmit}" but FAQ says the school/clinic files it`);
    } else if (kfSchool && faqDriver && !faqSchool) {
      problems.push(`submitter double-answer — Key Facts "${kfSubmit}" but FAQ says the driver files it`);
    }
  }

  // P13 template-join signatures anywhere on the page.
  for (const re of P13_JOINS) {
    const mm = re.exec(html);
    if (mm) {
      const i = mm.index;
      problems.push(`P13 join defect — "${htmlUnescape(html.slice(i, i + 40)).replace(/\s+/g, " ")}"`);
    }
  }

  return problems;
}

// ---------- main ----------

function main() {
  const buildDir = process.argv[2] || path.join(".next", "server", "app");
  if (!fs.existsSync(buildDir)) {
    console.error(`❌ page-contradiction guard: build dir not found: ${buildDir} (run next build first)`);
    process.exit(1);
  }

  const failures: string[] = [];
  let scanned = 0;
  for (const slug of getAllStateSlugs()) {
    const file = path.join(buildDir, `${slug}.html`);
    if (!fs.existsSync(file)) continue;
    scanned++;
    const html = fs.readFileSync(file, "utf-8");
    for (const p of scanState(html)) failures.push(`${slug}: ${p}`);
  }

  if (failures.length) {
    console.error(`❌ page-contradiction guard: ${failures.length} contradiction(s) across ${scanned} state pages:`);
    for (const f of failures) console.error(`   - ${f}`);
    console.error("\nFix at the state's FAQ / record so Key Facts and FAQ tell one story, then rebuild.");
    process.exit(1);
  }
  console.log(`✅ page-contradiction guard OK — ${scanned} state pages, Key Facts and FAQ agree.`);
}

main();
