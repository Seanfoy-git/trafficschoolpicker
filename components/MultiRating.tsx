import type { PlatformRating, BBBRating } from "@/lib/types";
import { Star, TrendingUp, TrendingDown, Minus, Shield } from "lucide-react";

const platformColors: Record<string, string> = {
  Trustpilot: "text-green-600",
  Google: "text-blue-600",
  "App Store": "text-blue-500",
  "Play Store": "text-emerald-600",
};

const platformBg: Record<string, string> = {
  Trustpilot: "bg-green-50",
  Google: "bg-blue-50",
  "App Store": "bg-sky-50",
  "Play Store": "bg-emerald-50",
};

function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up")
    return <TrendingUp className="w-3 h-3 text-green-500" aria-label="Improving" />;
  if (trend === "down")
    return <TrendingDown className="w-3 h-3 text-red-500" aria-label="Declining" />;
  return <Minus className="w-3 h-3 text-slate-400" aria-label="Stable" />;
}

const bbbGradeColors: Record<string, string> = {
  "A+": "bg-green-100 text-green-800",
  A: "bg-green-100 text-green-800",
  "A-": "bg-green-50 text-green-700",
  "B+": "bg-blue-100 text-blue-800",
  B: "bg-blue-100 text-blue-800",
  "B-": "bg-blue-50 text-blue-700",
  "C+": "bg-yellow-100 text-yellow-800",
  C: "bg-yellow-100 text-yellow-800",
  "C-": "bg-yellow-50 text-yellow-700",
  "D+": "bg-orange-100 text-orange-800",
  D: "bg-orange-100 text-orange-800",
  "D-": "bg-orange-50 text-orange-700",
  F: "bg-red-100 text-red-800",
};

function BBBBadge({ bbb }: { bbb: BBBRating }) {
  const colorClass = bbbGradeColors[bbb.grade] ?? "bg-slate-100 text-slate-700";
  const inner = (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${colorClass} text-sm font-semibold`}
    >
      <Shield className="w-3.5 h-3.5" />
      BBB {bbb.grade}
    </span>
  );

  if (bbb.url) {
    return (
      <a href={bbb.url} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
        {inner}
      </a>
    );
  }
  return inner;
}

export function MultiRating({
  ratings,
  bbb,
  layout = "horizontal",
}: {
  ratings: PlatformRating[];
  bbb?: BBBRating | null;
  layout?: "horizontal" | "vertical";
}) {
  if (ratings.length === 0 && !bbb) return null;

  const containerClass =
    layout === "horizontal"
      ? "flex flex-wrap gap-2"
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
      {bbb && <BBBBadge bbb={bbb} />}
    </div>
  );
}

/** Compact version for comparison table rows */
export function MultiRatingCompact({
  ratings,
  bbb,
}: {
  ratings: PlatformRating[];
  bbb?: BBBRating | null;
}) {
  if (ratings.length === 0 && !bbb) return null;

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
      {bbb && (
        <div className="flex items-center gap-1 text-xs">
          <Shield className="w-3 h-3 text-slate-500" />
          <span className="font-semibold text-slate-800">BBB {bbb.grade}</span>
        </div>
      )}
    </div>
  );
}

/** Synthesis block — "What reviewers say" */
export function ReviewSynthesis({
  good,
  bad,
}: {
  good: string;
  bad: string;
}) {
  if (!good && !bad) return null;

  return (
    <div className="bg-slate-50 rounded-lg p-4 mt-3 text-sm">
      <h4 className="font-semibold text-slate-700 text-xs uppercase tracking-wider mb-2">
        What reviewers say
      </h4>
      {good && (
        <p className="text-slate-600 mb-1">
          <span className="text-green-600 font-medium">+</span> {good}
        </p>
      )}
      {bad && (
        <p className="text-slate-600">
          <span className="text-red-500 font-medium">−</span> {bad}
        </p>
      )}
    </div>
  );
}

/** Average rating across all star-based platforms */
export function getAverageRating(
  ratings: PlatformRating[]
): { average: number; totalReviews: number } | null {
  if (ratings.length === 0) return null;
  const totalReviews = ratings.reduce((sum, r) => sum + r.reviewCount, 0);
  const weightedSum = ratings.reduce(
    (sum, r) => sum + r.rating * r.reviewCount,
    0
  );
  const average = totalReviews > 0 ? weightedSum / totalReviews : 0;
  return { average: Math.round(average * 10) / 10, totalReviews };
}
