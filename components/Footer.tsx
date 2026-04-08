import Link from "next/link";

const popularStates = [
  { name: "California", slug: "california" },
  { name: "Texas", slug: "texas" },
  { name: "Florida", slug: "florida" },
  { name: "New York", slug: "new-york" },
  { name: "Arizona", slug: "arizona" },
  { name: "Georgia", slug: "georgia" },
  { name: "Ohio", slug: "ohio" },
  { name: "Illinois", slug: "illinois" },
];

export function Footer() {
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
              TrafficSchoolPicker.com is an independent comparison site. We may
              earn commissions from partners when you click affiliate links. This
              does not affect our rankings or reviews. All information is for
              general guidance — verify requirements with your local court.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-700 mt-8 pt-6 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} TrafficSchoolPicker.com. All rights
          reserved. | Affiliate Disclosure: We earn commissions from partner links.
        </div>
      </div>
    </footer>
  );
}
