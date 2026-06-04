import Link from "next/link";
import { STATE_ADJACENCY } from "@/lib/state-adjacency";
import { getStateByCode, type StateMeta } from "@/lib/state-utils";

type Props = {
  /** Current state's two-letter code. */
  stateCode: string;
  /** Linkable states (Content Status Complete/Partial) from getLinkableStates(). */
  linkable: StateMeta[];
  max?: number;
};

// "Nearby states" cross-link module for state pages. Renders real, root-relative
// <a href> links (via next/link) to geographic neighbors that are eligible for
// linking — the mechanism that pushes crawl equity from indexed state pages to
// orphaned ones. Renders nothing when no neighbor qualifies.
export function NearbyStates({ stateCode, linkable, max = 6 }: Props) {
  const code = stateCode.toUpperCase();
  const linkableCodes = new Set(linkable.map((s) => s.code.toUpperCase()));

  const neighbors = (STATE_ADJACENCY[code] ?? [])
    .filter((c) => c !== code && linkableCodes.has(c))
    .map((c) => getStateByCode(c))
    .filter((s): s is StateMeta => Boolean(s))
    .slice(0, max);

  if (neighbors.length === 0) return null;

  return (
    <section className="py-12 bg-slate-50 border-t border-slate-100">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Nearby states</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {neighbors.map((s) => (
            <Link
              key={s.slug}
              href={`/${s.slug}`}
              className="block px-4 py-3 bg-white rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:border-accent hover:text-accent transition-colors"
            >
              {`${s.name} traffic school`}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
