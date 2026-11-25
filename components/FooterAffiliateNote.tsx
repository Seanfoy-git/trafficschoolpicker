"use client";

import { usePathname } from "next/navigation";

// The sitewide footer's affiliate disclosure. On /out-of-state-ticket the default
// sentence ("we earn commissions from partner links") is simply inaccurate — that
// page carries no affiliate links — so we swap it for a scoped, accurate note that
// discloses the site's affiliate model while stating plainly that THIS page has none.
// (FTC disclosure exists because there are links to disclose; here there aren't.)
// Rendered during SSR too, so the correct sentence is in the initial HTML.
const AFFILIATE_FREE_PATHS = new Set(["/out-of-state-ticket"]);

// State question pages (/{state}/{question}) are citation-only too (DOCUMENTATION.md
// §7.2): no affiliate, tracker or merchant markup ever renders on them.
const NOT_QUESTION_PREFIXES = new Set(["blog", "reviews", "admin", "api", "schools"]);
function isQuestionPage(pathname: string): boolean {
  const parts = pathname.split("/").filter(Boolean);
  return parts.length === 2 && !NOT_QUESTION_PREFIXES.has(parts[0]);
}

export function FooterAffiliateNote() {
  const pathname = usePathname();
  if (pathname && (AFFILIATE_FREE_PATHS.has(pathname) || isQuestionPage(pathname))) {
    return <>TrafficSchoolPicker earns commission from partner links elsewhere on this site. This page carries none.</>;
  }
  return <>We may earn a commission when you enroll through our links. It never changes our rankings.</>;
}
