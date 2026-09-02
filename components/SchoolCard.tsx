import type { School, SchoolWithPrice, ResolvedSchoolContent } from "@/lib/types";
import { MultiRating } from "./MultiRating";
import { Badge } from "./Badge";
import { AffiliateButton } from "./AffiliateButton";
import { trackerUrl } from "@/lib/affiliate";
import { CouponCode } from "./CouponCode";
import { Clock, CheckCircle, Smartphone, ThumbsUp, ThumbsDown, Tag } from "lucide-react";
import Link from "next/link";

export function SchoolCard({
  school,
  resolved,
  rank,
  showProsAndCons = false,
  stateCode,
  courseHours = null,
  badges = [],
}: {
  school: School | SchoolWithPrice;
  resolved: ResolvedSchoolContent;
  rank?: number;
  showProsAndCons?: boolean;
  stateCode?: string;
  // State-level course length (display string), null unless the state's Hours
  // Source is set. There is no per-school hours value. See Package 4.
  courseHours?: string | null;
  // Badges COMPUTED by the page for this card (P12): "Top Rated" only on the page's
  // highest-scored card, "Lowest price" only on the cheapest. The static Notion
  // "Badge" field is no longer rendered — the rule is generator-enforced per page.
  badges?: string[];
}) {
  const originalPrice = "originalPrice" in school ? (school as SchoolWithPrice).originalPrice : null;
  const hasActiveOffer = "hasActiveOffer" in school && (school as SchoolWithPrice).hasActiveOffer;
  const salePrice = "salePrice" in school ? (school as SchoolWithPrice).salePrice : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {rank && (
              <span className="text-xs font-bold text-white bg-primary rounded-full w-6 h-6 flex items-center justify-center">
                {rank}
              </span>
            )}
            <h3 className="text-lg font-bold text-slate-900">{school.name}</h3>
            {badges.map((b) => (
              <Badge key={b} type={b} />
            ))}
            {hasActiveOffer && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                <Tag className="w-3 h-3" /> Limited-time offer
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {school.tspScore != null && (
              <a
                href="/methodology"
                className="inline-flex items-baseline gap-1 bg-accent/10 text-accent rounded px-2 py-0.5 text-sm font-bold hover:bg-accent/20 transition-colors"
                title="How we score, our independent TSP Score"
              >
                TSP {school.tspScore.toFixed(1)}
                <span className="text-[10px] font-normal">/5</span>
              </a>
            )}
            {(school.ratings.length > 0 || school.bbb) && (
              <MultiRating ratings={school.ratings} bbb={school.bbb} />
            )}
          </div>

          {resolved.oneLiner && (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">
                Our take
              </p>
              <p className="text-sm text-slate-600">
                {resolved.oneLiner}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-600">
            {courseHours && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-slate-600" />
                {courseHours}
              </span>
            )}
            {resolved.approvalBodyShort !== "State Approved" && (
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-slate-600" />
                {resolved.approvalBodyShort}-approved
              </span>
            )}
            {school.mobileApp && (
              <span className="flex items-center gap-1">
                <Smartphone className="w-4 h-4 text-slate-600" />
                Mobile app
              </span>
            )}
          </div>

          {showProsAndCons && (() => {
            const { pros, cons } = resolved;
            return (pros.length > 0 || cons.length > 0) ? (
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              {pros.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-1 text-xs font-semibold text-green-700 mb-1.5">
                    <ThumbsUp className="w-3 h-3" /> Pros
                  </h4>
                  <ul className="space-y-1">
                    {pros.map((pro) => (
                      <li key={pro} className="flex items-start gap-1.5 text-xs text-slate-600">
                        <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {cons.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-1 text-xs font-semibold text-red-700 mb-1.5">
                    <ThumbsDown className="w-3 h-3" /> Cons
                  </h4>
                  <ul className="space-y-1">
                    {cons.map((con) => (
                      <li key={con} className="flex items-start gap-1.5 text-xs text-slate-600">
                        <span className="text-red-400 mt-0.5 shrink-0">&minus;</span>
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            ) : null;
          })()}

          {resolved.bestFor && (
            <div className="mt-3 text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Best for:</span> {resolved.bestFor}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-3 sm:min-w-[160px]">
          <div className="text-right">
            {resolved.price !== null ? (
              hasActiveOffer && salePrice !== null && salePrice < resolved.price ? (
                // Live deal: struck regular + current sale + savings.
                <>
                  <span className="text-sm text-slate-600 line-through">
                    ${resolved.price.toFixed(2)}
                  </span>
                  <div className="text-2xl font-bold text-slate-900">
                    ${salePrice.toFixed(2)}
                  </div>
                  <span className="text-xs font-semibold text-green-700">
                    Save {Math.round((1 - salePrice / resolved.price) * 100)}%
                  </span>
                </>
              ) : (
                <>
                  {originalPrice && (
                    <span className="text-sm text-slate-600 line-through">
                      ${originalPrice.toFixed(2)}
                    </span>
                  )}
                  <div className="text-2xl font-bold text-slate-900">
                    {resolved.priceDisplay}
                  </div>
                </>
              )
            ) : (
              <a
                href={trackerUrl(school.slug, { stateCode, sourcePageId: school.id }) ?? school.website}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-sm text-slate-500 underline"
              >
                Check website &rarr;
              </a>
            )}
          </div>

          <AffiliateButton school={school} stateCode={stateCode} />

          {school.trackingMethod === "coupon_code" && school.couponCode && (
            <CouponCode code={school.couponCode} />
          )}

          <Link
            href={`/reviews/${school.slug}`}
            className="text-sm text-accent underline"
          >
            Read full review &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
