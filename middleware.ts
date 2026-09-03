import { NextResponse } from "next/server";

/**
 * Permanently-gone URLs → HTTP 410 Gone (Package: crawl-efficiency, 2026-09).
 *
 * A 404 tells Google "try again later"; a 410 tells it "this is gone, stop retrying"
 * — which reclaims the wasted retry crawl on URLs that will never come back. The
 * `matcher` below scopes this middleware to ONLY these exact paths, so it does not
 * run (and adds zero latency) on the 142 live pages. To retire a URL permanently:
 * add its path to BOTH the GONE set and the matcher array.
 *
 * Seed entry: /reviews/5dollartrafficschool — a delisted school review whose only
 * internal reference (in llms.txt) was removed in this package. Extend from the
 * hosting-platform access logs / GSC crawl-stats 404 drilldown.
 */
const GONE = new Set<string>(["/reviews/5dollartrafficschool"]);

export function middleware(req: import("next/server").NextRequest) {
  if (GONE.has(req.nextUrl.pathname)) {
    return new NextResponse(null, { status: 410, statusText: "Gone" });
  }
  return NextResponse.next();
}

export const config = {
  // Exact-match only — middleware is inert for every other path.
  matcher: ["/reviews/5dollartrafficschool"],
};
