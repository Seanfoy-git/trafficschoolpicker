import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSchoolsForState, getStateInfo, getDirectoryForState, getPriceForState } from "@/lib/notion";
import { getStateFAQs } from "@/lib/state-faqs";
import { getStateBySlug, getAllStateSlugs } from "@/lib/state-utils";
import { SchoolCard } from "@/components/SchoolCard";
import { SchoolFAQ, FAQJsonLd } from "@/components/SchoolFAQ";
import { DirectoryTable } from "@/components/DirectoryTable";
import { TrustBar } from "@/components/TrustBar";
import { AffiliateButton } from "@/components/AffiliateButton";
import { RatingStars } from "@/components/RatingStars";
import { Badge } from "@/components/Badge";
import Link from "next/link";
import {
  ShieldCheck,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
} from "lucide-react";

export const revalidate = 86400; // 24 hours

type Props = {
  params: Promise<{ state: string }>;
};

export async function generateStaticParams() {
  return getAllStateSlugs().map((slug) => ({ state: slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state: stateSlug } = await params;
  const stateMeta = getStateBySlug(stateSlug);
  if (!stateMeta) return {};

  return {
    title: `Best Online Traffic Schools in ${stateMeta.name} (2026) — Compare & Save`,
    description: `Compare court-approved online traffic schools in ${stateMeta.name}. Find the lowest prices, read reviews, and enroll today.`,
    alternates: { canonical: `https://trafficschoolpicker.com/${stateMeta.slug}` },
    openGraph: {
      title: `${stateMeta.name} Online Traffic School — Compare & Save`,
      description: `Find the best court-approved online traffic school in ${stateMeta.name}. Compare prices, ratings, and features.`,
    },
  };
}

export default async function StatePage({ params }: Props) {
  const { state: stateSlug } = await params;
  const stateMeta = getStateBySlug(stateSlug);
  if (!stateMeta) notFound();

  const [schools, stateInfo, directory] = await Promise.all([
    getSchoolsForState(stateMeta.code),
    getStateInfo(stateMeta.code),
    getDirectoryForState(stateMeta.name),
  ]);

  const tier1 = schools.filter((s) => s.tier === 1);
  const tier2 = schools.filter((s) => s.tier === 2);
  const totalCount = tier1.length + tier2.length + directory.length;
  const faqs = getStateFAQs(stateMeta.code);

  const year = new Date().getFullYear();

  return (
    <>
      <FAQJsonLd faqs={faqs} />

      {/* 1. HERO */}
      <section className="bg-primary text-white py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            The {tier1.length > 0 ? tier1.length : schools.length} Best Online
            Traffic Schools in {stateMeta.name} ({year})
          </h1>
          <p className="text-lg text-slate-300 max-w-3xl">
            Comparing {tier1.length + tier2.length} reviewed pick
            {tier1.length + tier2.length !== 1 ? "s" : ""}
            {directory.length > 0 && (
              <> from {totalCount} {stateMeta.name}-approved online schools</>
            )}
          </p>
        </div>
      </section>

      <TrustBar />

      {/* 2. TIER 1 COMPARISON CARDS */}
      {tier1.length > 0 && (
        <section className="py-12 bg-white">
          <div className="max-w-5xl mx-auto px-4">
            <div className="space-y-4">
              {tier1.map((school, i) => (
                <SchoolCard
                  key={school.id}
                  school={school}
                  rank={i + 1}
                  showProsAndCons
                  stateCode={stateMeta.code}
                />
              ))}
            </div>

            <p className="mt-6 text-xs text-slate-500 leading-relaxed">
              We independently research and review all schools. We may earn a
              commission if you enroll via our links at no extra cost to you. All
              ratings from their respective review platforms and verified April
              2026.
            </p>
          </div>
        </section>
      )}

      {/* 3. TIER 2 — MORE OPTIONS */}
      {tier2.length > 0 && (
        <section className="py-12 bg-slate-50">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              More approved options in {stateMeta.name}
            </h2>
            <div className="space-y-3">
              {tier2.map((school) => (
                <div
                  key={school.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/reviews/${school.slug}`}
                        className="font-semibold text-slate-900 hover:text-accent"
                      >
                        {school.name}
                      </Link>
                      {school.badge && <Badge type={school.badge} />}
                    </div>
                    <p className="text-sm text-slate-600">{school.tagline}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      {(() => {
                        const { amount, display } = getPriceForState(school, stateMeta.code);
                        return amount !== null ? (
                          <div className="font-bold text-slate-900">{display}</div>
                        ) : (
                          <div className="text-xs text-slate-500">Check site</div>
                        );
                      })()}
                      {school.rating !== null && (
                        <div className="text-xs text-slate-500">
                          {school.rating}/5
                          {school.reviewSource && ` ${school.reviewSource}`}
                        </div>
                      )}
                    </div>
                    <AffiliateButton school={school} variant="secondary" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. STATE INFO BLOCK */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            {stateMeta.name} Traffic School Rules &amp; Requirements
          </h2>
          {stateInfo ? (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-50 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-slate-900">
                    Program: {stateInfo.programName}
                  </h3>
                </div>
                {stateInfo.minHours && (
                  <p className="text-sm text-slate-600 flex items-center gap-1.5 mb-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    Minimum {stateInfo.minHours} hours required
                  </p>
                )}
                {stateInfo.courtProcess && (
                  <p className="text-sm text-slate-600">{stateInfo.courtProcess}</p>
                )}
              </div>
              <div className="bg-slate-50 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-highlight" />
                  <h3 className="font-semibold text-slate-900">Eligibility</h3>
                </div>
                <p className="text-sm text-slate-600">
                  {stateInfo.eligibilityNotes || "Contact your local court for eligibility details."}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold text-slate-900">Online Allowed</h3>
                </div>
                <p className="text-sm text-slate-600">
                  {stateInfo.onlineAllowed
                    ? `Yes — ${stateMeta.name} allows eligible drivers to complete traffic school entirely online.`
                    : `${stateMeta.name} has limited online options. Check with your court.`}
                </p>
              </div>
              {stateInfo.dmvUrl && (
                <div className="bg-slate-50 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold text-slate-900">Official DMV Info</h3>
                  </div>
                  <a
                    href={stateInfo.dmvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-accent hover:underline flex items-center gap-1"
                  >
                    {stateMeta.name} DMV <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-lg p-6">
              <p className="text-sm text-slate-600">
                Specific {stateMeta.name} traffic school requirements vary by
                court. We recommend contacting the court listed on your citation
                or visiting your state DMV website for the most current
                eligibility rules and deadlines.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 5. FAQ */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4">
          <SchoolFAQ
            faqs={faqs}
            heading={`${stateMeta.name} Traffic School FAQ`}
          />
        </div>
      </section>

      {/* 6. DIRECTORY TABLE */}
      {directory.length > 0 && (
        <section className="py-12 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <DirectoryTable
              schools={directory}
              stateName={stateMeta.name}
              lastScraped={directory[0]?.lastScraped ?? null}
            />
          </div>
        </section>
      )}
    </>
  );
}
