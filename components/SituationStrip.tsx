import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { outOfStateGuideHref } from "./OutOfStateCallout";

/**
 * "Is this your situation?" — two one-line signposts directly under the first
 * comparison table (P17 follow-up). The comparison-first layout pushed the
 * out-of-state callout and the lawyer block several screens down; these keep
 * both within a scroll of the table. The full callout and lawyer block still
 * render lower on the page; this only points at them.
 */
export function SituationStrip({
  stateName,
  stateSlug,
  hasLawyerBlock,
}: {
  stateName: string;
  stateSlug: string;
  hasLawyerBlock: boolean;
}) {
  return (
    <section aria-label="Before you pick a course" className="bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">Before you pick a course</p>
          <ul className="mt-1 space-y-1 text-sm text-slate-700">
            <li>
              License from another state?{" "}
              <Link href={outOfStateGuideHref(stateSlug)} className="font-medium text-amber-800 underline">
                Read the out-of-state ticket guide
                <ArrowRight className="ml-1 inline h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </li>
            {hasLawyerBlock && (
              <li>
                Could a lawyer do better than a course?{" "}
                <a href="#lawyer" className="font-medium text-amber-800 underline">
                  See when a lawyer beats traffic school in {stateName}
                  <ArrowRight className="ml-1 inline h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
