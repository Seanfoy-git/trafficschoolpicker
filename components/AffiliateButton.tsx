"use client";

import { ExternalLink } from "lucide-react";
import type { School, SchoolWithPrice } from "@/lib/types";

export function AffiliateButton({
  school,
  variant = "primary",
}: {
  school: School | SchoolWithPrice;
  variant?: "primary" | "secondary";
}) {
  // Priority: state-specific affiliate URL > school default > website
  const stateUrl = "stateAffiliateUrl" in school ? school.stateAffiliateUrl : null;
  const affiliateUrl = stateUrl || school.affiliateUrl;
  const hasAffiliate = affiliateUrl.length > 0;
  const url = hasAffiliate ? affiliateUrl : school.website;
  const label = hasAffiliate ? "Enroll Now" : "Visit Website";

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
      rel={
        hasAffiliate
          ? "noopener noreferrer nofollow sponsored"
          : "noopener noreferrer"
      }
      className={`${baseClasses} ${variantClasses}`}
    >
      {label} <ExternalLink className="w-4 h-4" />
    </a>
  );
}
