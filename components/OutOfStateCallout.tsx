import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";

/**
 * "Licensed in another state?" signpost. Every state page is written for drivers
 * licensed in that state — this flags out-of-state drivers (ticketed here on a
 * licence from elsewhere) and sends them to the standing reference guide, where
 * the rules are genuinely different (and some options aren't open to them at all).
 * Rendered near the top of both the state hub pages and the question pages.
 */
export function OutOfStateCallout({ stateName }: { stateName: string }) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <p className="font-semibold text-amber-900">Licensed in another state?</p>
          <p className="text-sm text-amber-800 mt-0.5">
            If you were ticketed in {stateName} but your licence is from another
            state, what works here can be different — and some options aren&apos;t
            open to you at all.
          </p>
          <Link
            href="/out-of-state-ticket"
            className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-900 underline underline-offset-2 decoration-amber-400 hover:decoration-amber-700"
          >
            Read the out-of-state guide first
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
