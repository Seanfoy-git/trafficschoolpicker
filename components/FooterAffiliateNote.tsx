"use client";

import { usePathname } from "next/navigation";

// The sitewide footer's affiliate disclosure. On /out-of-state-ticket the default
// sentence ("we earn commissions from partner links") is simply inaccurate — that
// page carries no affiliate links — so we swap it for a scoped, accurate note that
// discloses the site's affiliate model while stating plainly that THIS page has none.
// (FTC disclosure exists because there are links to disclose; here there aren't.)
// Rendered during SSR too, so the correct sentence is in the initial HTML.
const AFFILIATE_FREE_PATHS = new Set(["/out-of-state-ticket"]);

export function FooterAffiliateNote() {
  const pathname = usePathname();
  if (pathname && AFFILIATE_FREE_PATHS.has(pathname)) {
    return <>TrafficSchoolPicker earns commission from partner links elsewhere on this site. This page carries none.</>;
  }
  return <>Affiliate disclosure: we earn commissions from partner links.</>;
}
