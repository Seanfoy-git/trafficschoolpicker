"use client";

import { ExternalLink } from "lucide-react";
import { track } from "@vercel/analytics";
import type { School, SchoolWithPrice } from "@/lib/types";
import { buildAffiliateLink } from "@/lib/affiliate";

export function AffiliateButton({
  school,
  variant = "primary",
  stateCode,
}: {
  school: School | SchoolWithPrice;
  variant?: "primary" | "secondary";
  stateCode?: string;
}) {
  const stateUrl = "stateAffiliateUrl" in school ? school.stateAffiliateUrl : null;
  const networkUrl = stateUrl || school.affiliateUrl;
  const hasAffiliate = Boolean(networkUrl);

  const { href, rel, target } = buildAffiliateLink({
    school: { slug: school.slug, name: school.name },
    affiliateProgram: {
      trackingMethod: school.trackingMethod,
      networkUrl,
      partnerSlug: school.partnerSlug,
      couponCode: school.couponCode,
      destinationUrl: school.website,
    },
    stateCode,
    sourcePageId: school.id,
  });

  const label = hasAffiliate ? "Enroll Now" : "Visit Website";

  function handleClick() {
    // Vercel Web Analytics (Pro) allows 2 properties per custom event, so we
    // send only the two that drive attribution: which school, on which state.
    track(hasAffiliate ? "affiliate_click" : "website_click", {
      school: school.slug,
      state: stateCode ?? "none",
    });
  }

  const baseClasses =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-colors";
  const variantClasses =
    variant === "primary"
      ? "bg-accent hover:bg-accent-dark text-white px-6 py-3 text-base"
      : "bg-white hover:bg-slate-50 text-accent border border-accent px-4 py-2 text-sm";

  return (
    <a
      href={href}
      target={target}
      rel={hasAffiliate ? `noopener noreferrer ${rel}` : "noopener noreferrer"}
      className={`${baseClasses} ${variantClasses}`}
      onClick={handleClick}
    >
      {label} <ExternalLink className="w-4 h-4" />
    </a>
  );
}
