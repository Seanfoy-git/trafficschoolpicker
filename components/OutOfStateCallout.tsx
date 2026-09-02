import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";

// The out-of-state guide covers these ten states in depth. For them the callout
// deep-links straight to that state's section in the guide; every other state
// gets the general guide, which explains the framework and carries the
// "request your state" form. Keep in sync with the state sections in
// app/out-of-state-ticket/content.ts (anchor ids = state slug).
const GUIDE_COVERED = new Set([
  "arizona", "california", "florida", "georgia", "new-jersey",
  "new-york", "north-carolina", "ohio", "texas", "virginia",
]);

/**
 * Out-of-state signpost. Every state page is written for that state's own
 * license holders; this flags the two out-of-state cases (ticketed here on a
 * license from elsewhere, or holding this state's license but ticketed
 * elsewhere) and routes both to the reference guide (to the state's own section
 * when we cover it, else the general guide). A distinct callout, not a footnote.
 */
export function OutOfStateCallout({ stateName, stateSlug }: { stateName: string; stateSlug: string }) {
  const covered = GUIDE_COVERED.has(stateSlug);
  const href = covered ? `/out-of-state-ticket#${stateSlug}` : "/out-of-state-ticket";

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">
            Ticket in {stateName}, license from another state?
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            This page is written for drivers who hold a {stateName} license. If you got the
            ticket in {stateName} but your license is from another state, different rules
            decide what reaches your home state&apos;s record and whether a course helps.
          </p>
          <Link
            href={href}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-800"
          >
            Read the out-of-state ticket guide
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <p className="mt-3 text-sm text-slate-600">
            <Link href={href} className="font-medium text-amber-700 hover:underline">
              {stateName} license, ticket from another state? Same guide, other direction.
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
