import Link from "next/link";
import { getStatesForPost } from "@/lib/internal-links";
import { getStateByCode, type StateMeta } from "@/lib/state-utils";

type Props = {
  /** Current blog post slug. */
  postSlug: string;
  /** Linkable states (Content Status Complete/Partial) from getLinkableStates(). */
  linkable: StateMeta[];
};

// Blog-post → state cross-link module (the blog side of the bidirectional
// blog ↔ state linking). Links each post to its most relevant state pages,
// gated on linkable status so we never point readers (or crawlers) at a thin
// page. Renders nothing when no relevant state qualifies.
export function RelatedStateGuides({ postSlug, linkable }: Props) {
  const linkableCodes = new Set(linkable.map((s) => s.code.toUpperCase()));

  const states = getStatesForPost(postSlug)
    .filter((code) => linkableCodes.has(code.toUpperCase()))
    .map((code) => getStateByCode(code))
    .filter((s): s is StateMeta => Boolean(s));

  if (states.length === 0) return null;

  return (
    <aside className="mt-12 pt-8 border-t border-slate-200">
      <h2 className="text-xl font-bold text-slate-900 mb-4">
        State traffic school guides
      </h2>
      <div className="flex flex-wrap gap-2">
        {states.map((s) => (
          <Link
            key={s.slug}
            href={`/${s.slug}`}
            className="inline-block px-4 py-2 rounded-full border border-slate-200 text-sm font-medium text-slate-700 hover:border-accent hover:text-accent transition-colors"
          >
            {`${s.name} traffic school`}
          </Link>
        ))}
      </div>
    </aside>
  );
}
