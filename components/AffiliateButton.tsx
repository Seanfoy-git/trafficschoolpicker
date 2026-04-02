"use client";

import { ExternalLink } from "lucide-react";
import { School } from "@/lib/schools";
import { buildAffiliateUrl, trackClick } from "@/lib/affiliate";

export function AffiliateButton({
  school,
  state,
  source,
  variant = "primary",
  children,
}: {
  school: School;
  state: string;
  source: string;
  variant?: "primary" | "secondary";
  children?: React.ReactNode;
}) {
  const url = buildAffiliateUrl(school, state, source);

  const handleClick = () => {
    trackClick(school.id, state, source);
  };

  const baseClasses =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-colors";
  const variantClasses =
    variant === "primary"
      ? "bg-accent hover:bg-accent-dark text-white px-6 py-3 text-base"
      : "bg-white hover:bg-slate-50 text-accent border border-accent px-4 py-2 text-sm";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer nofollow sponsored"
      onClick={handleClick}
      className={`${baseClasses} ${variantClasses}`}
    >
      {children ?? (
        <>
          Enroll Now <ExternalLink className="w-4 h-4" />
        </>
      )}
    </a>
  );
}
