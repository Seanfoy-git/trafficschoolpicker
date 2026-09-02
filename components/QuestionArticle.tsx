import { CheckCircle } from "lucide-react";
import type { ReviewBlock, ReviewRichText, QuestionKeyFact } from "@/lib/types";
import { ReviewBody } from "./ReviewBody";
import { OutOfStateCallout } from "./OutOfStateCallout";

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

// Natural-language references in the prose → the sibling question slug they point
// at. A phrase links only when that sibling row is Complete for the same state
// (checked by the caller); otherwise the phrase renders as plain text. Add a row
// per new question template.
const SIBLING_QUESTION_PHRASES: Array<{ re: RegExp; slug: string }> = [
  { re: /(?:our|the)\s+points\s+page/i, slug: "does-traffic-school-remove-points" },
  { re: /(?:our|the)\s+cost\s+page/i, slug: "how-much-does-traffic-school-cost" },
];

type LinkRule = { re: RegExp; href: string };

/** Inject internal links into the prose: the FIRST match of each rule becomes a
 *  link, splitting the run so surrounding bold/italic marks survive. One link per
 *  rule total (a rule that never matches, or points at a non-Complete sibling,
 *  simply leaves the phrase as plain text). */
function linkBodyReferences(blocks: ReviewBlock[], rules: LinkRule[]): ReviewBlock[] {
  const done = new Set<number>();
  return blocks.map((b) => {
    if (b.type !== "paragraph" || done.size === rules.length) return b;
    let runs = b.richText;
    for (let ri = 0; ri < rules.length; ri++) {
      if (done.has(ri)) continue;
      const rule = rules[ri];
      const next: ReviewRichText[] = [];
      let linkedHere = false;
      for (const run of runs) {
        if (linkedHere || run.href) { next.push(run); continue; }
        const m = run.text.match(rule.re);
        if (!m || m.index === undefined) { next.push(run); continue; }
        const before = run.text.slice(0, m.index);
        const after = run.text.slice(m.index + m[0].length);
        if (before) next.push({ ...run, text: before });
        next.push({ ...run, text: m[0], href: rule.href });
        if (after) next.push({ ...run, text: after });
        linkedHere = true;
      }
      if (linkedHere) { done.add(ri); runs = next; }
    }
    return runs === b.richText ? b : { ...b, richText: runs };
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
  siblingSlugs = [],
}: {
  keyFacts: QuestionKeyFact[];
  body: ReviewBlock[];
  sources: ReviewBlock[];
  stateName: string;
  stateSlug: string;
  lastVerified: string | null;
  hubPath?: string | null;
  siblingSlugs?: string[]; // Complete question slugs for this state, excluding self
}) {
  const verified = verifiedLabel(lastVerified);
  // The Last Verified date renders as its own footer line (like the state page),
  // so drop any duplicate "Last verified" row from the Key Facts list.
  const facts = keyFacts.filter((f) => !/^last\s+verified$/i.test(f.label.trim()));
  // Body links: the parent state page ("{State} page"), plus any sibling question
  // page whose row is Complete for this state ("our points page" → /{state}/{slug}).
  const rules: LinkRule[] = [
    { re: new RegExp(`${escapeRegex(stateName)}\\s+page`, "i"), href: `/${stateSlug}` },
    ...SIBLING_QUESTION_PHRASES
      .filter((p) => siblingSlugs.includes(p.slug))
      .map((p) => ({ re: p.re, href: `/${stateSlug}/${p.slug}` })),
  ];
  const linkedBody = linkBodyReferences(body, rules);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Out-of-state signpost — same reference guide as the state hub pages. */}
      <OutOfStateCallout stateName={stateName} stateSlug={stateSlug} />

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
          {verified && <p className="mt-4 text-xs text-slate-600">Last verified {verified}</p>}
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
          {verified && <p className="mt-3 text-xs text-slate-600">Last verified {verified}</p>}
        </section>
      )}
    </div>
  );
}
