import Link from "next/link";
import { getLinkableStates } from "@/lib/notion";
import { FooterAffiliateNote } from "./FooterAffiliateNote";

// Curated "popular" ordering for the compact column; filtered against the
// linkable set below so a state never appears here unless it's eligible.
const POPULAR_SLUGS = [
  "california",
  "texas",
  "florida",
  "new-york",
  "arizona",
  "georgia",
  "ohio",
  "illinois",
];

export async function Footer() {
  // Sitewide source of truth for which states are linkable (Content Status
  // Complete/Partial). cache() dedupes this with the page's own call within the
  // same render, so the footer adds no extra Notion query per page.
  const linkableStates = await getLinkableStates();
  const popularStates = POPULAR_SLUGS.map((slug) =>
    linkableStates.find((s) => s.slug === slug)
  ).filter((s): s is (typeof linkableStates)[number] => Boolean(s));

  return (
    <footer className="bg-primary text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <svg width="28" height="28" viewBox="100 40 114 114" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="157" cy="97" r="55" fill="#085041"/>
                <circle cx="157" cy="97" r="51" fill="#1D9E75"/>
                <polygon points="157,58 187,72 157,86 127,72" fill="white"/>
                <rect x="145" y="86" width="24" height="13" rx="3" fill="white"/>
                <line x1="187" y1="72" x2="187" y2="94" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="187" cy="97" r="4" fill="white"/>
                <path d="M 140,114 L 157,132 L 174,114" fill="none" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="font-medium">
                <span className="text-white">trafficschool</span>
                <span className="text-emerald-400">picker</span>
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Independent comparison site helping drivers find the best
              court-approved online traffic school at the lowest price.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Popular States</h4>
            <ul className="space-y-1.5 text-sm text-slate-300">
              {popularStates.map((state) => (
                <li key={state.slug}>
                  <Link
                    href={`/${state.slug}`}
                    className="hover:text-highlight transition-colors"
                  >
                    {state.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Resources</h4>
            <ul className="space-y-1.5 text-sm text-slate-300">
              <li>
                <Link href="/schools" className="hover:text-highlight transition-colors">
                  All Traffic Schools
                </Link>
              </li>
              <li>
                <Link href="/reviews" className="hover:text-highlight transition-colors">
                  School Reviews
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-highlight transition-colors">
                  How We Rank Schools
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-highlight transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Legal</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              TrafficSchoolPicker.com is an independent comparison site — not a
              traffic school, law firm, court, or government agency — and nothing
              here is legal advice. Prices and promotional offers are gathered
              periodically, may change or expire without notice, and can differ
              from a provider&apos;s checkout; always confirm the current price and
              terms on the provider&apos;s own website before purchasing. Whether an
              online course is accepted, dismisses your ticket, or removes points
              depends on your state and the specific court handling your case —
              verify with the court listed on your citation before enrolling. We
              do not guarantee any outcome. We may earn a commission when you enroll
              through our links, at no extra cost to you; this never affects our
              rankings or reviews.
            </p>
            <ul className="mt-3 space-y-1.5 text-xs">
              <li>
                <Link href="/disclaimer" className="text-slate-400 hover:text-highlight transition-colors">
                  Disclaimer
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-slate-400 hover:text-highlight transition-colors">
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-slate-400 hover:text-highlight transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* BROWSE BY STATE — sitewide footer band linking every linkable state
            (Content Status Complete/Partial). A reliable, low-effort crawl
            discovery path: real root-relative <a href> links on every page. */}
        {linkableStates.length > 0 && (
          <div className="border-t border-slate-700 mt-8 pt-6">
            <h4 className="font-semibold mb-3">Browse traffic schools by state</h4>
            <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-slate-300">
              {linkableStates.map((state) => (
                <li key={state.slug}>
                  <Link
                    href={`/${state.slug}`}
                    className="hover:text-highlight transition-colors"
                  >
                    {state.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="border-t border-slate-700 mt-8 pt-6 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} PellucidMedia LLC · TrafficSchoolPicker.com.
          All rights reserved. | <FooterAffiliateNote /> | Prices &amp; offers subject to
          change — verify on the provider&apos;s site.
        </div>
      </div>
    </footer>
  );
}
