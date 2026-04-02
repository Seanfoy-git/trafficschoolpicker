import type { School } from "@/lib/types";
import { RatingStars } from "./RatingStars";
import { Badge } from "./Badge";
import { AffiliateButton } from "./AffiliateButton";
import { Clock, CheckCircle, Smartphone, ThumbsUp, ThumbsDown } from "lucide-react";
import Link from "next/link";

export function SchoolCard({
  school,
  rank,
  showProsAndCons = false,
}: {
  school: School;
  rank?: number;
  showProsAndCons?: boolean;
}) {
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
            {school.badge && <Badge type={school.badge} />}
          </div>

          {school.rating !== null && (
            <div className="flex items-center gap-1.5">
              <RatingStars rating={school.rating} count={school.reviewCount ?? undefined} />
              {school.reviewSource && school.reviewUrl && (
                <a
                  href={school.reviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-500 hover:underline"
                >
                  {school.reviewSource}
                </a>
              )}
              {school.reviewSource && !school.reviewUrl && (
                <span className="text-xs text-slate-500">{school.reviewSource}</span>
              )}
            </div>
          )}

          <p className="mt-2 text-sm text-slate-600">{school.tagline}</p>

          <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-600">
            {school.completionHours && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-slate-400" />
                {school.completionHours} hours
              </span>
            )}
            {school.courtAcceptance && (
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-slate-400" />
                {school.courtAcceptance}
              </span>
            )}
            {school.mobileApp && (
              <span className="flex items-center gap-1">
                <Smartphone className="w-4 h-4 text-slate-400" />
                Mobile app
              </span>
            )}
          </div>

          {showProsAndCons && (school.pros.length > 0 || school.cons.length > 0) && (
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              {school.pros.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-1 text-xs font-semibold text-green-700 mb-1.5">
                    <ThumbsUp className="w-3 h-3" /> Pros
                  </h4>
                  <ul className="space-y-1">
                    {school.pros.map((pro) => (
                      <li key={pro} className="flex items-start gap-1.5 text-xs text-slate-600">
                        <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {school.cons.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-1 text-xs font-semibold text-red-700 mb-1.5">
                    <ThumbsDown className="w-3 h-3" /> Cons
                  </h4>
                  <ul className="space-y-1">
                    {school.cons.map((con) => (
                      <li key={con} className="flex items-start gap-1.5 text-xs text-slate-600">
                        <span className="text-red-400 mt-0.5 shrink-0">&minus;</span>
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-3 sm:min-w-[160px]">
          <div className="text-right">
            {school.originalPrice && (
              <span className="text-sm text-slate-400 line-through">
                ${school.originalPrice.toFixed(2)}
              </span>
            )}
            <div className="text-2xl font-bold text-slate-900">
              ${school.price.toFixed(2)}
            </div>
          </div>

          <AffiliateButton school={school} />

          <Link
            href={`/reviews/${school.slug}`}
            className="text-sm text-accent hover:underline"
          >
            Read full review &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
