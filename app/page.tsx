import type { Metadata } from "next";
import { HOME_SEO } from "@/lib/seo-config";
import { StateSelector } from "@/components/StateSelector";
import { TrustBar } from "@/components/TrustBar";
import { SchoolCard } from "@/components/SchoolCard";
import { SchoolFAQ, FAQJsonLd } from "@/components/SchoolFAQ";
import { getAllSchools, getStateRequirements, resolveStateContent, getLinkableStates, getLatestStateVerification, bySchoolRank } from "@/lib/notion";
import Link from "next/link";
import { ArrowRight, Search, BarChart3, MousePointerClick } from "lucide-react";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: HOME_SEO.title,
  description: HOME_SEO.description,
  alternates: {
    canonical: "https://www.trafficschoolpicker.com",
  },
  openGraph: {
    title: HOME_SEO.title,
    description: HOME_SEO.description,
    url: "https://www.trafficschoolpicker.com",
    siteName: "TrafficSchoolPicker",
    type: "website",
  },
};

const homeFaqs = [
  {
    question: "Does online traffic school remove a ticket?",
    answer:
      "In most states, completing an approved online traffic school course can dismiss your ticket or prevent points from appearing on your driving record. The specific outcome depends on your state's laws and the court handling your case.",
  },
  {
    question: "How long does traffic school take?",
    answer:
      "Most online traffic school courses take between 4 to 8 hours to complete, depending on your state's requirements. Many states mandate a minimum seat time. Most courses let you log in and out and spread the time over several days.",
  },
  {
    question: "Is online traffic school accepted by courts?",
    answer:
      "The schools we list are licensed or approved by state regulatory agencies (the DMV or its equivalent). Whether a specific court accepts an online course for ticket dismissal can still vary by county and by case, so always confirm with the court listed on your citation before you enroll.",
  },
  {
    question: "How much does traffic school cost?",
    answer:
      "Online traffic school typically costs between $19.95 and $49.99, depending on the provider and your state. This is significantly cheaper than paying the full ticket fine plus insurance premium increases.",
  },
  {
    question: "What happens if I don't take traffic school?",
    answer:
      "If you're eligible for traffic school but choose not to attend, the violation will remain on your driving record. This can lead to points on your license, increased insurance premiums (often 20-40% higher for 3-5 years), and potentially license suspension.",
  },
  {
    question: "Can I take traffic school on my phone?",
    answer:
      "Yes! Most modern online traffic schools are mobile-friendly, and some offer dedicated mobile apps. You can complete your course on a smartphone or tablet from anywhere with an internet connection.",
  },
];

export default async function HomePage() {
  const [allSchools, stateReqs, linkableStates, latestVerified] = await Promise.all([
    getAllSchools(),
    getStateRequirements(),
    getLinkableStates(),
    getLatestStateVerification(),
  ]);
  const emptyVariants = new Map();
  // P12: Top Picks lead by TSP Score (descending), tie-break price ascending, the
  // same rule the state grids use. No per-state price on the home page, so the
  // tie-break reads each school's generic price.
  const topSchools = [...allSchools]
    .filter((s) => s.tier === 1)
    .sort(bySchoolRank<(typeof allSchools)[number]>((s) => s.genericPrice ?? null))
    .slice(0, 3);
  // P12 badges on Top Picks: "Top Rated" on the highest-scored (first, already sorted),
  // "Lowest price" on the cheapest by displayed price.
  const topResolved = topSchools.map((school) => ({
    school,
    resolved: resolveStateContent(school, null, stateReqs, emptyVariants),
  }));
  const homeTopRatedId = topResolved.find((x) => x.school.tspScore != null)?.school.id ?? null;
  let homeCheapestId: string | null = null;
  let homeMin = Infinity;
  for (const { school, resolved } of topResolved) {
    if (resolved.price != null && resolved.price < homeMin) {
      homeMin = resolved.price;
      homeCheapestId = school.id;
    }
  }
  const homeBadgesFor = (id: string): string[] => [
    ...(id === homeTopRatedId ? ["Top Rated"] : []),
    ...(id === homeCheapestId ? ["Lowest price"] : []),
  ];

  return (
    <>
      <FAQJsonLd faqs={homeFaqs} />

      {/* Hero */}
      <section className="bg-primary text-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            {HOME_SEO.h1}
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Compare online traffic school and defensive driving options by price,
            speed, and quality. Save money and keep your driving record clean.
          </p>
          <StateSelector size="lg" />
        </div>
      </section>

      <TrustBar lastVerified={latestVerified} />

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-slate-900 mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Search,
                title: "Select your state",
                desc: "Choose your state to see approved schools and state-specific pricing.",
              },
              {
                icon: BarChart3,
                title: "Compare prices & features",
                desc: "Sort by price and rating, and see each school's TSP Score, to find the perfect fit.",
              },
              {
                icon: MousePointerClick,
                title: "Enroll in minutes",
                desc: "Click through to your chosen school and start your course right away.",
              },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-7 h-7 text-accent" />
                </div>
                <div className="text-xs font-semibold text-accent uppercase tracking-wider mb-1">
                  Step {i + 1}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Picks */}
      {topSchools.length > 0 && (
        <section className="py-16 bg-slate-50">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              Our Top Picks
            </h2>
            <p className="text-slate-600 mb-4">
              Ranked by our independent TSP Score, highest first (price breaks a tie).
            </p>
            {/* FTC affiliate disclosure — visible, ABOVE the first monetized CTA (P12). */}
            <p className="mb-8 text-xs text-slate-500">
              We may earn a commission if you enroll through our links. It never changes a
              school&apos;s score or rank.
            </p>
            <div className="space-y-4">
              {topResolved.map(({ school, resolved }, i) => (
                <SchoolCard
                  key={school.id}
                  school={school}
                  resolved={resolved}
                  rank={i + 1}
                  showProsAndCons
                  badges={homeBadgesFor(school.id)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Trust Us */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
            Why Trust TrafficSchoolPicker?
          </h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            We independently review the schools we score. Each one gets a TSP Score
            built from six weighted dimensions: course experience, price and
            transparency, state fit, certificate handling, support and
            guarantees, and track record. We may earn affiliate commissions, but that
            never affects a school&apos;s score or where it ranks.
          </p>
          <Link
            href="/methodology"
            className="inline-flex items-center gap-1 text-accent font-semibold hover:underline"
          >
            Read our full methodology <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* State Grid — "All States" discovery grid. Only states eligible for
          linking (Content Status Complete/Partial, via getLinkableStates) are
          rendered, as real server-rendered <a href> links with descriptive
          anchors, so Googlebot can reach every eligible state page from the
          homepage. */}
      {linkableStates.length > 0 && (
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-8 text-center">
              Find Traffic Schools by State
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {linkableStates.map((state) => (
                <Link
                  key={state.slug}
                  href={`/${state.slug}`}
                  className="block px-4 py-3 bg-white rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:border-accent hover:text-accent transition-colors text-center"
                >
                  {`${state.name} traffic school`}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <SchoolFAQ faqs={homeFaqs} />
        </div>
      </section>
    </>
  );
}
