import { Star } from "lucide-react";

export function RatingStars({
  rating,
  count,
  size = "md",
}: {
  rating: number;
  count?: number;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = { sm: "w-4 h-4", md: "w-5 h-5", lg: "w-6 h-6" }[size];
  const textSize = { sm: "text-xs", md: "text-sm", lg: "text-base" }[size];

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => {
          const fill = Math.min(1, Math.max(0, rating - (star - 1)));
          return (
            <div key={star} className="relative">
              <Star className={`${sizeClass} text-slate-200`} fill="currentColor" />
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star className={`${sizeClass} text-highlight`} fill="currentColor" />
              </div>
            </div>
          );
        })}
      </div>
      <span className={`${textSize} font-semibold text-slate-800`}>{rating}</span>
      {count !== undefined && (
        <span className={`${textSize} text-slate-500`}>
          ({count.toLocaleString()} reviews)
        </span>
      )}
    </div>
  );
}
