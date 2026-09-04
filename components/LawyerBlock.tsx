"use client";

import { ExternalLink, Scale } from "lucide-react";
import { track } from "@vercel/analytics";
import type { LawyerBlock as LawyerBlockData } from "@/lib/types";

/**
 * "When a lawyer beats traffic school" — the attorney-referral section (Play A).
 *
 * Renders between the eligibility context and the school comparison on the priority
 * state pages. One-way outbound links to researched firms: NO affiliate deal, NO
 * referral fee, NO reciprocity asked. Data comes from the States DB "Lawyer Block"
 * field so firms and copy are edited in Notion, never in code. Returns null when the
 * state has no firms (graceful degradation — the block never renders empty).
 *
 * Outbound clicks fire a Vercel Analytics `lawyer_click` event (same mechanism as
 * `affiliate_click`) so Play A referral engagement can be measured per state/firm.
 */
export function LawyerBlock({
  block,
  stateName,
  stateCode,
}: {
  block: LawyerBlockData;
  stateName: string;
  stateCode: string;
}) {
  if (!block.firms.length) return null;

  return (
    <section className="py-8 bg-white border-b border-slate-100">
      <div className="max-w-3xl mx-auto px-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-3">
            <Scale className="w-5 h-5 text-slate-500 shrink-0" />
            When a lawyer beats traffic school
          </h2>

          {block.disqualifier && (
            <p className="text-sm text-slate-700 leading-relaxed mb-4">{block.disqualifier}</p>
          )}

          <ul className="space-y-3">
            {block.firms.map((firm) => (
              <li
                key={firm.url}
                className="flex flex-col gap-0.5 border-l-2 border-slate-200 pl-3"
              >
                <a
                  href={firm.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    track("lawyer_click", { firm: firm.name, state: stateCode })
                  }
                  className="inline-flex items-center gap-1 font-semibold text-accent-dark underline w-fit"
                >
                  {firm.name}
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
                {firm.note && <span className="text-xs text-slate-600">{firm.note}</span>}
              </li>
            ))}
          </ul>

          <p className="mt-4 text-sm text-slate-700 leading-relaxed">
            If none of these describe your situation, an online course is very likely the
            cheaper, faster path in {stateName}. Compare your options below.
          </p>

          <p className="mt-3 text-xs text-slate-500">
            <span className="font-semibold">How these firms get listed:</span> each is a
            real firm with an active traffic-ticket practice in {stateName} whose published
            guidance we read ourselves. No fee, no affiliate relationship, and no ranking or
            endorsement. Nothing here is legal advice.
          </p>
        </div>
      </div>
    </section>
  );
}
