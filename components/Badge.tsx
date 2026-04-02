import { Award, Zap, Star, Trophy } from "lucide-react";

const badgeConfig = {
  "best-value": { label: "Best Value", icon: Award, bg: "bg-green-100", text: "text-green-800", border: "border-green-200" },
  fastest: { label: "Fastest", icon: Zap, bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" },
  "top-rated": { label: "Top Rated", icon: Star, bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200" },
  "editors-choice": { label: "Editor's Choice", icon: Trophy, bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200" },
} as const;

export function Badge({ type }: { type: keyof typeof badgeConfig }) {
  const config = badgeConfig[type];
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
