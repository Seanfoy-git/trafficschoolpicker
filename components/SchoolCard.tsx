import { School } from "@/lib/schools";
import { RatingStars } from "./RatingStars";
import { Badge } from "./Badge";
import { AffiliateButton } from "./AffiliateButton";
import { Clock, CheckCircle, Smartphone } from "lucide-react";
import Link from "next/link";

export function SchoolCard({
  school,
  state = "general",
  rank,
}: {
  school: School;
  state?: string;
  rank?: number;
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

          <RatingStars rating={school.rating} count={school.reviewCount} />

          <p className="mt-2 text-sm text-slate-600">{school.description}</p>

          <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-600">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-slate-400" />
              {school.completionTimeHours} hours
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-slate-400" />
              {school.courtAcceptance === "all"
                ? "All courts"
                : school.courtAcceptance === "most"
                ? "Most courts"
                : "Some courts"}
            </span>
            {school.mobileApp && (
              <span className="flex items-center gap-1">
                <Smartphone className="w-4 h-4 text-slate-400" />
                Mobile app
              </span>
            )}
          </div>
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

          <AffiliateButton school={school} state={state} source="school-card" />

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
