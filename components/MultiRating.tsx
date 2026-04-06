import type { PlatformRating } from "@/lib/types";
import { Star, TrendingUp, TrendingDown, Minus } from "lucide-react";

const platformColors: Record<string, string> = {
  Trustpilot: "text-green-600",
  Google: "text-blue-600",
  Yelp: "text-red-600",
};

const platformBg: Record<string, string> = {
  Trustpilot: "bg-green-50",
  Google: "bg-blue-50",
  Yelp: "bg-red-50",
};

function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up")
    return <TrendingUp className="w-3 h-3 text-green-500" aria-label="Improving" />;
  if (trend === "down")
    return <TrendingDown className="w-3 h-3 text-red-500" aria-label="Declining" />;
  return <Minus className="w-3 h-3 text-slate-400" aria-label="Stable" />;
}

export function MultiRating({
  ratings,
  layout = "horizontal",
}: {
  ratings: PlatformRating[];
  layout?: "horizontal" | "vertical";
}) {
  if (ratings.length === 0) return null;

  const containerClass =
    layout === "horizontal"
      ? "flex flex-wrap gap-3"
      : "flex flex-col gap-2";

  return (
    <div className={containerClass}>
      {ratings.map((r) => (
        <a
          key={r.platform}
          href={r.url ?? undefined}
          target={r.url ? "_blank" : undefined}
          rel={r.url ? "noopener noreferrer" : undefined}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${
            platformBg[r.platform] ?? "bg-slate-50"
          } ${r.url ? "hover:opacity-80 cursor-pointer" : ""} transition-opacity`}
        >
          <Star
            className={`w-3.5 h-3.5 ${platformColors[r.platform] ?? "text-slate-600"} fill-current`}
          />
          <span className="text-sm font-semibold text-slate-900">
            {r.rating.toFixed(1)}
          </span>
          <span className="text-xs text-slate-500">
            ({r.reviewCount.toLocaleString()})
          </span>
          <TrendIcon trend={r.trend} />
          <span className="text-xs text-slate-400">{r.platform}</span>
        </a>
      ))}
    </div>
  );
}

/** Compact version for use inside comparison table rows */
export function MultiRatingCompact({
  ratings,
}: {
  ratings: PlatformRating[];
}) {
  if (ratings.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      {ratings.map((r) => (
        <div key={r.platform} className="flex items-center gap-1 text-xs">
          <Star
            className={`w-3 h-3 ${platformColors[r.platform] ?? "text-slate-600"} fill-current`}
          />
          <span className="font-semibold text-slate-800">
            {r.rating.toFixed(1)}
          </span>
          <TrendIcon trend={r.trend} />
          <span className="text-slate-400">{r.platform}</span>
        </div>
      ))}
    </div>
  );
}

/** Average rating across all platforms */
export function getAverageRating(
  ratings: PlatformRating[]
): { average: number; totalReviews: number } | null {
  if (ratings.length === 0) return null;
  const totalReviews = ratings.reduce((sum, r) => sum + r.reviewCount, 0);
  // Weighted average by review count
  const weightedSum = ratings.reduce(
    (sum, r) => sum + r.rating * r.reviewCount,
    0
  );
  const average = totalReviews > 0 ? weightedSum / totalReviews : 0;
  return { average: Math.round(average * 10) / 10, totalReviews };
}
