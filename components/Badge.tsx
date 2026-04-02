import { Award, Zap, Star, Trophy, DollarSign } from "lucide-react";

const badgeConfig: Record<
  string,
  {
    label: string;
    icon: typeof Award;
    bg: string;
    text: string;
    border: string;
  }
> = {
  "Best Value": { label: "Best Value", icon: Award, bg: "bg-green-100", text: "text-green-800", border: "border-green-200" },
  Fastest: { label: "Fastest", icon: Zap, bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" },
  "Top Rated": { label: "Top Rated", icon: Star, bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200" },
  "Editors Choice": { label: "Editor's Choice", icon: Trophy, bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200" },
  "Budget Pick": { label: "Budget Pick", icon: DollarSign, bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-200" },
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
