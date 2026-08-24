import { CheckCircle } from "lucide-react";
import type { ReviewBlock, ReviewRichText, QuestionKeyFact } from "@/lib/types";
import { ReviewBody } from "./ReviewBody";

/** Month + year in UTC — matches the state-page Key Facts footer. */
function verifiedLabel(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", timeZone: "UTC" });
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Turn the FIRST plain-text "{State} page" reference in the prose into a link to
 *  the parent state page (the single contextual link the brief asks for). Splits
 *  the run so bold/italic marks on the surrounding text are preserved. */
function linkStateReference(blocks: ReviewBlock[], stateName: string, stateSlug: string): ReviewBlock[] {
  const re = new RegExp(`${escapeRegex(stateName)}\\s+page`, "i");
  let linked = false;
  return blocks.map((b) => {
    if (linked || b.type !== "paragraph") return b;
    const runs: ReviewRichText[] = [];
    for (const run of b.richText) {
      if (linked || run.href) { runs.push(run); continue; }
      const m = run.text.match(re);
      if (!m || m.index === undefined) { runs.push(run); continue; }
      const before = run.text.slice(0, m.index);
      const after = run.text.slice(m.index + m[0].length);
      if (before) runs.push({ ...run, text: before });
      runs.push({ ...run, text: m[0], href: `/${stateSlug}` });
      if (after) runs.push({ ...run, text: after });
      linked = true;
    }
    return { ...b, richText: runs };
  });
}

/**
 * Renders one state question page's article body from parsed Notion blocks:
 * Key Facts as a <dl> (same semantic treatment as the state-page Key Facts block,
 * including the Last Verified line), the prose (with the single state-page link
 * injected), and a visible Sources block. NO school cards, affiliate, or tracker
 * links — these pages exist to be cited; monetization lives one click away on the
 * state page.
 */
export function QuestionArticle({
  keyFacts,
  body,
  sources,
  stateName,
  stateSlug,
  lastVerified,
  hubPath,
}: {
  keyFacts: QuestionKeyFact[];
  body: ReviewBlock[];
  sources: ReviewBlock[];
  stateName: string;
  stateSlug: string;
  lastVerified: string | null;
  hubPath?: string | null;
}) {
  const verified = verifiedLabel(lastVerified);
  // The Last Verified date renders as its own footer line (like the state page),
  // so drop any duplicate "Last verified" row from the Key Facts list.
  const facts = keyFacts.filter((f) => !/^last\s+verified$/i.test(f.label.trim()));
  const linkedBody = linkStateReference(body, stateName, stateSlug);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Key Facts */}
      {facts.length > 0 && (
        <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
            <CheckCircle className="w-5 h-5 text-accent shrink-0" />
            Key Facts
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
          {verified && <p className="mt-4 text-xs text-slate-400">Last verified {verified}</p>}
        </div>
      )}

      {/* Body prose */}
      {linkedBody.length > 0 && (
        <article className="prose-tsp">
          <ReviewBody blocks={linkedBody} />
        </article>
      )}

      {/* National overview (hub) link */}
      {hubPath && (
        <p className="text-sm text-slate-600">
          For the national overview, see{" "}
          <a href={hubPath} className="text-accent hover:underline font-medium">
            does traffic school remove points
          </a>
          .
        </p>
      )}

      {/* Sources (visible, not just markup) */}
      {sources.length > 0 && (
        <section className="border-t border-slate-200 pt-6">
          <h2 className="text-base font-bold text-slate-900 mb-3">Sources</h2>
          <div className="text-sm text-slate-600 space-y-2">
            <ReviewBody blocks={sources} />
          </div>
          {verified && <p className="mt-3 text-xs text-slate-400">Last verified {verified}</p>}
        </section>
      )}
    </div>
  );
}
