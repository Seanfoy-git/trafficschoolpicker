import Link from "next/link";
import { GraduationCap } from "lucide-react";

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
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="w-6 h-6" />
              <span className="font-bold">TrafficSchoolPicker</span>
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
