import type { StateInfo } from "@/lib/types";
import { CheckCircle } from "lucide-react";

type Fact = { label: string; value: string };

/** Eligibility value for the Key Facts row: the full sentence WITH its citation,
 *  minus only the trailing freshness stamp. The old first-sentence approach broke
 *  on the period inside an abbreviated cite ("Conn.", "K.S.A.", "Minn.", "Miss.",
 *  "Neb.", "S.C.") and truncated the citation mid-word (P10 Task 1). */
function eligibilitySummary(text: string): string {
  return text.trim().replace(/\s*Last checked\s+[A-Za-z]+\s+\d{4}\.?\s*$/i, "").trim();
}

/** Month + year in UTC (matches TrustBar; ISO dates are UTC, so no TZ drift). */
function verifiedLabel(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", timeZone: "UTC" });
}

/**
 * Compact, snippet-friendly "Key Facts" summary near the top of a state page — a
 * definition list of label/value pairs for featured snippets, AI Overviews, and
 * clean LLM extraction. Each row renders only when its value is present (no
 * placeholders); the fields adapt to onlineStatus. Returns null when there is
 * nothing substantive to show (e.g. an unpopulated / Unknown state). This is the
 * at-a-glance version — the deeper "State Rules & Requirements" section stays below.
 */
export function StateKeyFacts({
  stateName,
  stateInfo,
  lowestPrice,
  year,
}: {
  stateName: string;
  stateInfo: StateInfo | null;
  lowestPrice: number | null;
  year: number;
}) {
  if (!stateInfo) return null;
  const status = stateInfo.onlineStatus;
  const facts: Fact[] = [];

  // Online availability — phrased for what's actually true in this state.
  const available =
    status === "Online — ticket dismissal"
      ? "Yes — for ticket dismissal"
      : status === "Online — insurance discount only"
        ? "Insurance discount only"
        : status === "Online — court discretion"
          ? "Yes — but court acceptance varies"
          : status === "Online — point reduction"
            ? "Yes — for point reduction"
            : status === "In-person only"
              ? "In-person only"
              : null; // Court program only / Unknown → omit
  if (available) facts.push({ label: "Online course available", value: available });

  // Ticket dismissal — the row names the actual mechanism from the program model,
  // never a bare "Yes" on a point-credit, masking, or court-discretion state
  // (P10 Task 1). A per-state "Dismissal Answer" override wins when set (e.g. CA
  // masking); otherwise the honest phrase is derived from onlineStatus.
  const dismissal =
    stateInfo.dismissalAnswer?.trim() ||
    (status === "Online — ticket dismissal"
      ? "Yes"
      : status === "Online — insurance discount only"
        ? "No — insurance discount only"
        : status === "Online — point reduction"
          ? "No, point credit instead"
          : status === "Online — court discretion"
            ? "Court-by-court"
            : status === "Court program only"
              ? "Via a court program, not a retail course"
              : null); // in-person / unknown → omit
  if (dismissal) facts.push({ label: "Ticket dismissal", value: dismissal });

  // Course length is a state-level fact and renders only when sourced (courseHours
  // is null unless Hours Source is set). No per-school hours anywhere. See Package 4.
  if (stateInfo.courseHours) facts.push({ label: "Course length", value: stateInfo.courseHours });

  // Reuses the exact lowest card/Offer price, so it can't drift from the grid.
  if (lowestPrice !== null) facts.push({ label: "Typical cost", value: `from $${lowestPrice.toFixed(2)}` });

  if (stateInfo.eligibility?.trim())
    facts.push({ label: "Eligibility", value: eligibilitySummary(stateInfo.eligibility) });

  if (stateInfo.certificateSubmission?.trim())
    facts.push({ label: "Certificate submission", value: stateInfo.certificateSubmission.trim() });

  if (facts.length === 0) return null;

  const verified = stateInfo.lastVerified ? verifiedLabel(stateInfo.lastVerified) : null;

  return (
    <section className="py-8 bg-white border-b border-slate-100">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
            <CheckCircle className="w-5 h-5 text-accent shrink-0" />
            {stateName} Traffic School: Key Facts ({year})
          </h2>
          <dl className="divide-y divide-slate-200">
            {facts.map((f) => (
              <div
                key={f.label}
                className="grid grid-cols-1 sm:grid-cols-[minmax(0,12rem)_1fr] gap-0.5 sm:gap-4 py-2"
              >
                <dt className="text-sm font-semibold text-slate-600">{f.label}</dt>
                <dd className="text-sm text-slate-900">{f.value}</dd>
              </div>
            ))}
          </dl>
          {verified && (
            <p className="mt-4 text-xs text-slate-400">Last verified {verified}</p>
          )}
        </div>
      </div>
    </section>
  );
}
