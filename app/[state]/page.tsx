import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getSchoolPricingForState,
  getStateInfo,
  getDirectoryForState,
  getStateRequirements,
  getSchoolVariantsForState,
  resolveStateContent,
} from "@/lib/notion";
import { STATE_SEO } from "@/lib/seo-config";
import { getStateFAQs } from "@/lib/state-faqs";
import { getNotionStateFaqs } from "@/lib/notion-faqs";
import { getStateBySlug, getAllStateSlugs } from "@/lib/state-utils";
import { SchoolCard } from "@/components/SchoolCard";
import { FaqSection } from "@/components/FaqSection";
import { FAQJsonLd } from "@/components/SchoolFAQ";
import { DirectoryTable } from "@/components/DirectoryTable";
import { TrustBar } from "@/components/TrustBar";
import { AffiliateButton } from "@/components/AffiliateButton";
import { MultiRating } from "@/components/MultiRating";
import { Badge } from "@/components/Badge";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  FileText,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  AlertTriangle,
  Info,
} from "lucide-react";

// YouTube video IDs for state explainer videos — add new states as videos are published
const STATE_VIDEOS: Record<string, string> = {
  "texas": "kLiynsBRIkc",
  "california": "csik5zxdVDs",
  "florida": "QG12_HGlsAQ",
};

export const revalidate = 86400;

type Props = { params: Promise<{ state: string }> };

export async function generateStaticParams() {
  return getAllStateSlugs().map((slug) => ({ state: slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state: stateSlug } = await params;
  const stateMeta = getStateBySlug(stateSlug);
  if (!stateMeta) return {};

  const seo = STATE_SEO[stateSlug];
  if (!seo) {
    return {
      title: `Online Traffic School in ${stateMeta.name} (2026)`,
      description: `Compare court-approved online traffic schools in ${stateMeta.name}. Find the lowest price and enroll today.`,
      alternates: { canonical: `https://www.trafficschoolpicker.com/${stateMeta.slug}` },
    };
  }

  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: `https://www.trafficschoolpicker.com${seo.canonicalPath}` },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: `https://www.trafficschoolpicker.com${seo.canonicalPath}`,
      siteName: "TrafficSchoolPicker",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: seo.title,
      description: seo.description,
    },
  };
}

export default async function StatePage({ params }: Props) {
  const { state: stateSlug } = await params;
  const stateMeta = getStateBySlug(stateSlug);
  if (!stateMeta) notFound();

  const [schools, stateInfo, directory, notionFaqs, stateReqs, variants] = await Promise.all([
    getSchoolPricingForState(stateMeta.code),
    getStateInfo(stateMeta.code),
    getDirectoryForState(stateMeta.name),
    getNotionStateFaqs(stateSlug),
    getStateRequirements(),
    getSchoolVariantsForState(stateMeta.code),
  ]);

  // Use Notion FAQs if available, fall back to static
  const faqs = notionFaqs.length > 0
    ? notionFaqs
    : getStateFAQs(stateMeta.code).map((f) => ({ question: f.question, answer: f.answer }));

  const seo = STATE_SEO[stateSlug];
  const onlineStatus = stateInfo?.onlineStatus ?? "Unknown";
  const tier1 = schools.filter((s) => s.tier === 1);
  const tier2 = schools.filter((s) => s.tier === 2);
  const year = new Date().getFullYear();
  const h1 = seo?.h1 ?? `Online Traffic Schools in ${stateMeta.name} (${year})`;

  return (
    <>
      <FAQJsonLd faqs={faqs} />

      {/* HERO */}
      <section className="bg-primary text-white py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-5 mb-3">
            <Image
              src={`/flags/${stateSlug}.png`}
              alt={`${stateMeta.name} state flag`}
              width={80}
              height={53}
              className="hidden md:block rounded shadow-md border border-white/20 object-cover shrink-0"
            />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {onlineStatus === "In-person only"
                ? `Traffic School in ${stateMeta.name}`
                : h1}
            </h1>
          </div>
          {onlineStatus === "Online — ticket dismissal" && schools.length > 0 && (
            <p className="text-lg text-slate-300 max-w-3xl">
              Comparing {schools.length} reviewed option
              {schools.length !== 1 ? "s" : ""}
              {directory.length > 0 && <> from {schools.length + directory.length} {stateMeta.name}-approved online schools</>}
            </p>
          )}
          {onlineStatus === "Online — insurance discount only" && (
            <p className="text-lg text-slate-300 max-w-3xl">
              Online courses in {stateMeta.name} are for insurance discounts, not ticket dismissal
            </p>
          )}
        </div>
      </section>

      <TrustBar />

      {/* STATUS BANNERS */}
      {onlineStatus === "Online — insurance discount only" && (
        <section className="py-6 bg-amber-50 border-b border-amber-200">
          <div className="max-w-5xl mx-auto px-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-800">Insurance discount only</p>
              <p className="text-sm text-amber-700">
                Traffic school in {stateMeta.name} is for insurance discounts, not ticket dismissal.
                Check your eligibility with your court before enrolling.
              </p>
            </div>
          </div>
        </section>
      )}

      {onlineStatus === "In-person only" && (
        <section className="py-12 bg-white">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Online traffic school isn&apos;t available in {stateMeta.name}
            </h2>
            <p className="text-slate-600 mb-6">
              You&apos;ll need to attend an approved in-person course.
              Contact the court listed on your citation for approved providers.
            </p>
            {stateInfo?.dmvUrl && (
              <a
                href={stateInfo.dmvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-light transition-colors"
              >
                Visit {stateMeta.name} DMV <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </section>
      )}

      {onlineStatus === "Unknown" && (
        <section className="py-8 bg-slate-50 border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-slate-700">Status not confirmed</p>
              <p className="text-sm text-slate-600">
                We&apos;re still researching {stateMeta.name}&apos;s online traffic school rules.
                Contact the court on your citation for current eligibility.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* GEORGIA-SPECIFIC CALLOUT */}
      {stateSlug === "georgia" && (
        <section className="py-6 bg-amber-50 border-b border-amber-200">
          <div className="max-w-5xl mx-auto px-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-800 mb-1">
                Important: Georgia online courses are for ticket dismissal only
              </p>
              <p className="text-sm text-amber-700">
                Georgia&apos;s DDS point reduction program requires a 6-hour course
                completed in a classroom or via Zoom — online-only courses are not
                accepted for that benefit. The schools listed below are accepted by
                many Georgia courts for ticket dismissal. Check with your court
                before enrolling.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* STATE VIDEO EXPLAINER */}
      {STATE_VIDEOS[stateSlug] && (
        <section className="py-10 bg-white">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              {stateMeta.name} Traffic School — Video Guide
            </h2>
            <div className="relative w-full overflow-hidden rounded-xl shadow-md" style={{ paddingBottom: "56.25%" }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${STATE_VIDEOS[stateSlug]}?modestbranding=1&rel=0&origin=https://www.trafficschoolpicker.com`}
                title={`${stateMeta.name} traffic school explainer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      )}

      {/* TIER 1 COMPARISON CARDS — only for online states */}
      {(onlineStatus === "Online — ticket dismissal" || onlineStatus === "Online — insurance discount only") &&
        tier1.length > 0 && (
        <section className="py-12 bg-white">
          <div className="max-w-5xl mx-auto px-4">
            <div className="space-y-4">
              {tier1.map((school, i) => (
                <SchoolCard
                  key={school.id}
                  school={school}
                  resolved={resolveStateContent(school, stateMeta.code, stateReqs, variants)}
                  rank={i + 1}
                  showProsAndCons
                />
              ))}
            </div>
            <p className="mt-6 text-xs text-slate-500 leading-relaxed">
              We independently research and review all schools. We may earn a
              commission if you enroll via our links at no extra cost to you.
            </p>
          </div>
        </section>
      )}

      {/* TIER 2 — MORE OPTIONS */}
      {(onlineStatus === "Online — ticket dismissal" || onlineStatus === "Online — insurance discount only") &&
        tier2.length > 0 && (
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
                      <Link href={`/reviews/${school.slug}`} className="font-semibold text-slate-900 hover:text-accent">
                        {school.name}
                      </Link>
                      {school.badge && <Badge type={school.badge} />}
                    </div>
                    {school.tagline && (
                      <p className="text-sm text-slate-600 italic">
                        &ldquo;{school.tagline}&rdquo;
                      </p>
                    )}
                    {school.ratings.length > 0 && (
                      <div className="mt-1">
                        <MultiRating ratings={school.ratings} bbb={school.bbb} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      {school.price !== null ? (
                        <div className="font-bold text-slate-900">${school.price.toFixed(2)}</div>
                      ) : (
                        <div className="text-xs text-slate-500">Check site</div>
                      )}
                      {school.priceNote && (
                        <div className="text-xs text-slate-400">{school.priceNote}</div>
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

      {/* STATE INFO */}
      {stateInfo && (
        <section className="py-12 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              {stateMeta.name} Traffic School Rules &amp; Requirements
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-50 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold text-slate-900">Online Status</h3>
                </div>
                <p className="text-sm text-slate-600">{stateInfo.onlineStatus}</p>
                {stateInfo.minHours && (
                  <p className="text-sm text-slate-500 mt-1">
                    Minimum {stateInfo.minHours} hours required
                  </p>
                )}
              </div>
              {stateInfo.eligibility && (
                <div className="bg-slate-50 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-highlight" />
                    <h3 className="font-semibold text-slate-900">Eligibility</h3>
                  </div>
                  <p className="text-sm text-slate-600">{stateInfo.eligibility}</p>
                </div>
              )}
              {stateInfo.courtNotes && (
                <div className="bg-slate-50 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-slate-900">Court Acceptance</h3>
                  </div>
                  <p className="text-sm text-slate-600">{stateInfo.courtNotes}</p>
                </div>
              )}
              {stateInfo.certificateSubmission && (
                <div className="bg-slate-50 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold text-slate-900">Certificate Submission</h3>
                  </div>
                  <p className="text-sm text-slate-600">{stateInfo.certificateSubmission}</p>
                </div>
              )}
              {stateInfo.dmvUrl && (
                <div className="bg-slate-50 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold text-slate-900">Official DMV</h3>
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
              {stateInfo.notes && (
                <div className="bg-slate-50 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-5 h-5 text-slate-500" />
                    <h3 className="font-semibold text-slate-900">Notes</h3>
                  </div>
                  <p className="text-sm text-slate-600">{stateInfo.notes}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4">
          <FaqSection faqs={faqs} stateDisplayName={stateMeta.name} />
        </div>
      </section>

      {/* DIRECTORY TABLE — always show if data exists */}
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
