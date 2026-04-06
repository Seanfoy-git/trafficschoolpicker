import type { Metadata } from "next";
import { HOME_SEO } from "@/lib/seo-config";
import { StateSelector } from "@/components/StateSelector";
import { TrustBar } from "@/components/TrustBar";
import { SchoolCard } from "@/components/SchoolCard";
import { SchoolFAQ, FAQJsonLd } from "@/components/SchoolFAQ";
import { getAllSchools } from "@/lib/notion";
import { STATE_LIST } from "@/lib/state-utils";
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
      "Yes — all schools listed on TrafficSchoolPicker are court-approved and accepted by the relevant state DMV or court system. We only list schools that have been officially licensed or approved by state regulatory agencies.",
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
  const allSchools = await getAllSchools();
  const topSchools = allSchools.filter((s) => s.tier === 1).slice(0, 3);

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
            Compare court-approved online traffic schools by price, speed, and
            quality. Save money and keep your driving record clean.
          </p>
          <StateSelector size="lg" />
        </div>
      </section>

      <TrustBar />

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
                desc: "Choose your state to see court-approved schools and state-specific pricing.",
              },
              {
                icon: BarChart3,
                title: "Compare prices & features",
                desc: "Sort by price, rating, and completion time to find the perfect fit.",
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
            <p className="text-slate-600 mb-8">
              Hand-picked by our editorial team based on price, quality, and user
              satisfaction.
            </p>
            <div className="space-y-4">
              {topSchools.map((school, i) => (
                <SchoolCard key={school.id} school={school} rank={i + 1} showProsAndCons />
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
            We independently research and review every traffic school we list.
            Our rankings are based on price, course quality, user reviews,
            completion time, and court acceptance rates. We may earn affiliate
            commissions, but this never influences our rankings or
            recommendations.
          </p>
          <Link
            href="/about"
            className="inline-flex items-center gap-1 text-accent font-semibold hover:underline"
          >
            Read our full methodology <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* State Grid */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-8 text-center">
            Find Traffic Schools by State
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {STATE_LIST.map((state) => (
              <Link
                key={state.slug}
                href={`/${state.slug}`}
                className="block px-4 py-3 bg-white rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:border-accent hover:text-accent transition-colors text-center"
              >
                {state.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <SchoolFAQ faqs={homeFaqs} />
        </div>
      </section>
    </>
  );
}
