import { Metadata } from "next";
import { notFound } from "next/navigation";
import { states, getStateBySlug, getAllStateSlugs } from "@/lib/states";
import { getSchoolsForState } from "@/lib/schools";
import { ComparisonTable } from "@/components/ComparisonTable";
import { SchoolCard } from "@/components/SchoolCard";
import { SchoolFAQ, FAQJsonLd } from "@/components/SchoolFAQ";
import { TrustBar } from "@/components/TrustBar";
import Link from "next/link";
import { ShieldCheck, FileText, CheckCircle, AlertCircle } from "lucide-react";

type Props = {
  params: Promise<{ state: string }>;
};

export async function generateStaticParams() {
  return getAllStateSlugs().map((slug) => ({ state: slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state: stateSlug } = await params;
  const state = getStateBySlug(stateSlug);
  if (!state) return {};

  return {
    title: `Best Online Traffic Schools in ${state.name} (2025) — Compare & Save`,
    description: `Compare ${state.approvedSchoolCount} court-approved online traffic schools in ${state.name}. Prices from $${
      getSchoolsForState(stateSlug).reduce((min, s) => Math.min(min, s.price), Infinity) || 19.95
    }. Dismiss your ticket today.`,
    alternates: { canonical: `https://trafficschoolpicker.com/${state.slug}` },
    openGraph: {
      title: `${state.name} Online Traffic School — Compare & Save`,
      description: `Find the best court-approved online traffic school in ${state.name}. Compare prices, ratings, and features.`,
    },
  };
}

export default async function StatePage({ params }: Props) {
  const { state: stateSlug } = await params;
  const state = getStateBySlug(stateSlug);
  if (!state) notFound();

  const stateSchools = getSchoolsForState(stateSlug);
  const topPick = stateSchools.length > 0
    ? [...stateSchools].sort((a, b) => b.rating - a.rating)[0]
    : null;

  const neighborStates = state.neighboringStates
    .map((slug) => getStateBySlug(slug))
    .filter(Boolean);

  const faqs = [
    {
      question: `Is online traffic school allowed in ${state.name}?`,
      answer: state.onlineAllowed
        ? `Yes, ${state.name} allows eligible drivers to complete traffic school online. ${state.courtNotes}`
        : `${state.name} has limited online traffic school options. Contact your local court for availability.`,
    },
    {
      question: `Which courts accept online traffic school in ${state.name}?`,
      answer: state.courtNotes,
    },
    {
      question: `How do I submit my traffic school certificate in ${state.name}?`,
      answer: state.certificateNotes,
    },
    {
      question: `Who is eligible for traffic school in ${state.name}?`,
      answer: state.eligibilityNotes,
    },
    {
      question: `How much does online traffic school cost in ${state.name}?`,
      answer: `The average price for online traffic school in ${state.name} is $${state.averagePrice.toFixed(2)}. Prices range from $${
        stateSchools.length > 0
          ? stateSchools.reduce((min, s) => Math.min(min, s.price), Infinity).toFixed(2)
          : "19.95"
      } to $${
        stateSchools.length > 0
          ? stateSchools.reduce((max, s) => Math.max(max, s.price), 0).toFixed(2)
          : "29.99"
      } depending on the provider.`,
    },
  ];

  return (
    <>
      <FAQJsonLd faqs={faqs} />

      {/* Hero */}
      <section className="bg-primary text-white py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            {state.name} Online Traffic School — Compare &amp; Save
          </h1>
          <p className="text-lg text-slate-300 mb-4 max-w-3xl">
            {state.description}
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-1.5 bg-white/10 rounded-full px-4 py-1.5">
              <ShieldCheck className="w-4 h-4" />
              {stateSchools.length} approved schools
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 rounded-full px-4 py-1.5">
              Avg. price: ${state.averagePrice.toFixed(2)}
            </span>
          </div>
        </div>
      </section>

      <TrustBar />

      {/* Comparison Table */}
      {stateSchools.length > 0 && (
        <section className="py-12 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Compare Traffic Schools in {state.name}
            </h2>
            <ComparisonTable schools={stateSchools} state={stateSlug} />
          </div>
        </section>
      )}

      {/* Top Pick */}
      {topPick && (
        <section className="py-12 bg-slate-50">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Our Top Pick in {state.name}
            </h2>
            <SchoolCard school={topPick} state={stateSlug} rank={1} />
          </div>
        </section>
      )}

      {/* State-Specific Info */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            {state.name} Traffic School Rules &amp; Requirements
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-accent" />
                <h3 className="font-semibold text-slate-900">Court Acceptance</h3>
              </div>
              <p className="text-sm text-slate-600">{state.courtNotes}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-highlight" />
                <h3 className="font-semibold text-slate-900">Eligibility</h3>
              </div>
              <p className="text-sm text-slate-600">{state.eligibilityNotes}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-slate-900">Certificate Submission</h3>
              </div>
              <p className="text-sm text-slate-600">{state.certificateNotes}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-slate-900">Online Allowed</h3>
              </div>
              <p className="text-sm text-slate-600">
                {state.onlineAllowed
                  ? `Yes — ${state.name} allows eligible drivers to complete traffic school entirely online.`
                  : `${state.name} has limited online options. Check with your court.`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* School Cards */}
      {stateSchools.length > 0 && (
        <section className="py-12 bg-slate-50">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              All Traffic Schools Available in {state.name}
            </h2>
            <div className="space-y-4">
              {stateSchools.map((school, i) => (
                <SchoolCard
                  key={school.id}
                  school={school}
                  state={stateSlug}
                  rank={i + 1}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-12 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <SchoolFAQ
            faqs={faqs}
            heading={`${state.name} Traffic School FAQ`}
          />
        </div>
      </section>

      {/* Related States */}
      {neighborStates.length > 0 && (
        <section className="py-12 bg-slate-50">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Traffic Schools in Nearby States
            </h2>
            <div className="flex flex-wrap gap-3">
              {neighborStates.map(
                (ns) =>
                  ns && (
                    <Link
                      key={ns.slug}
                      href={`/${ns.slug}`}
                      className="px-4 py-2 bg-white rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:border-accent hover:text-accent transition-colors"
                    >
                      {ns.name}
                    </Link>
                  )
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
