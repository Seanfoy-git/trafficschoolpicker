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
 * "Licensed in another state?" signpost. Every state page is written for that
 * state's licensees; this flags out-of-state drivers (ticketed here on a licence
 * from elsewhere) and routes them to the reference guide — to the state's own
 * section when we cover it, else to the general guide. Rendered near the top of
 * the state hub pages and the question pages.
 */
export function OutOfStateCallout({ stateName, stateSlug }: { stateName: string; stateSlug: string }) {
  const covered = GUIDE_COVERED.has(stateSlug);
  const href = covered ? `/out-of-state-ticket#${stateSlug}` : "/out-of-state-ticket";
  const cta = covered ? `See the ${stateName} section` : "Read the out-of-state guide";

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 sm:px-5 sm:py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
          <div>
            <p className="font-semibold text-slate-900">Licensed in another state?</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              This page is written for {stateName} drivers. If your licence is from
              another state, some of these options may not apply to you.
            </p>
          </div>
        </div>
        <Link
          href={href}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start whitespace-nowrap rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700 sm:self-center"
        >
          {cta}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
