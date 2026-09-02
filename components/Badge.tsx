import { Star, DollarSign } from "lucide-react";

// P12: the only two badges the ordering/price rule produces, computed per page.
// "Top Rated" renders on the page's highest-scored card; "Lowest price" on the
// cheapest. No other rating-flavored badges (Best Value / Editor's Choice / etc.).
const badgeConfig: Record<
  string,
  {
    label: string;
    icon: typeof Star;
    bg: string;
    text: string;
    border: string;
  }
> = {
  "Top Rated": { label: "Top Rated", icon: Star, bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200" },
  "Lowest price": { label: "Lowest price", icon: DollarSign, bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-200" },
};

export function Badge({ type }: { type: string }) {
  const config = badgeConfig[type];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}
