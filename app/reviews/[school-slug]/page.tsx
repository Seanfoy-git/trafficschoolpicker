import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllSchools, getSchoolBySlug, getSchoolReviewBody } from "@/lib/notion";
import { buildCriticReview, buildBreadcrumbList, schoolImageUrl } from "@/lib/structured-data";
import { ReviewBody } from "@/components/ReviewBody";
import { MultiRating } from "@/components/MultiRating";
import { Badge } from "@/components/Badge";
import { AffiliateButton } from "@/components/AffiliateButton";
import { trackerUrl } from "@/lib/affiliate";
import {
  Clock,
  CheckCircle,
  Smartphone,
  Shield,
  Send,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
} from "lucide-react";

export const revalidate = 86400;

type Props = {
  params: Promise<{ "school-slug": string }>;
};

export async function generateStaticParams() {
  const schools = await getAllSchools();
  return schools.map((s) => ({ "school-slug": s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { "school-slug": slug } = await params;
  const school = await getSchoolBySlug(slug);
  if (!school) return {};

  return {
    title: `${school.name} Review (2026) — Is It Worth It?`,
    description: `Detailed review of ${school.name} online traffic school. See pros, cons, pricing, and our independent verdict.`,
    alternates: {
      canonical: `https://www.trafficschoolpicker.com/reviews/${school.slug}`,
    },
    openGraph: {
      title: `${school.name} Review — TrafficSchoolPicker`,
      description: `Is ${school.name} worth it? Read our in-depth review with pricing, features, and student feedback.`,
      url: `https://www.trafficschoolpicker.com/reviews/${school.slug}`,
      siteName: "TrafficSchoolPicker",
      type: "article",
      images: [schoolImageUrl(school.slug)],
    },
    twitter: {
      card: "summary_large_image",
      title: `${school.name} Review — TrafficSchoolPicker`,
      images: [schoolImageUrl(school.slug)],
    },
  };
}

export default async function ReviewPage({ params }: Props) {
  const { "school-slug": slug } = await params;
  const school = await getSchoolBySlug(slug);
  if (!school) notFound();

  const allSchools = await getAllSchools();
  const competitors = allSchools.filter((s) => s.id !== school.id).slice(0, 3);

  // Long-form written review from the school's Notion page body (blocks). Fetched
  // at build/ISR; empty for schools whose body isn't written yet (no section).
  const reviewBody = await getSchoolReviewBody(school.id);

  // Critic Review markup — ONLY for schools with a TSP Score (an approved written
  // review). reviewRating is our own six-dimension score, never a borrowed number;
  // scoreless schools emit no Review at all (Package 5).
  const reviewJsonLd =
    school.tspScore != null
      ? buildCriticReview({
          name: school.name,
          website: school.website || null,
          tspScore: school.tspScore,
          dateIso: school.lastVerified ?? "2026-08-20",
          reviewBody: `${school.name} earns a TSP Score of ${school.tspScore.toFixed(1)} out of 5 in our independent review, weighing course experience, price and transparency, state coverage, certificate handling, support and guarantees, and track record.`,
        })
      : null;

  // "As of" month for the attributed third-party ratings — from the row's last
  // verified date so the borrowed numbers always carry a freshness stamp (Package 5).
  const asOf = school.lastVerified
    ? new Date(school.lastVerified).toLocaleDateString("en-US", { year: "numeric", month: "long", timeZone: "UTC" })
    : null;

  // Breadcrumb: Home › Reviews › {School}. The /reviews hub is a real index route,
  // so the trail includes the Reviews crumb.
  const breadcrumbSchema = buildBreadcrumbList([
    { name: "Home", path: "/" },
    { name: "Reviews", path: "/reviews" },
    { name: school.name, path: `/reviews/${school.slug}` },
  ]);

  return (
    <>
      {reviewJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewJsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Review Header */}
      <section className="bg-primary text-white py-10 md:py-14">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {school.name} Review
            </h1>
            {school.badge && <Badge type={school.badge} />}
          </div>
          {school.tspScore != null && (
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="inline-flex items-baseline gap-1.5 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">TSP Score</span>
                <span className="text-2xl font-bold">{school.tspScore.toFixed(1)}</span>
                <span className="text-sm text-slate-300">/ 5</span>
              </span>
              <a href="/methodology" className="text-sm text-slate-200 underline hover:text-white">
                how we score
              </a>
            </div>
          )}
          {school.ratings.length > 0 || school.bbb ? (
            <div className="mb-4">
              <p className="text-xs text-slate-300 mb-1.5">
                Third-party ratings{asOf ? ` (as of ${asOf})` : ""}, attributed, not ours:
              </p>
              <MultiRating ratings={school.ratings} bbb={school.bbb} />
            </div>
          ) : (
            <p className="text-sm text-slate-300 mb-4">
              {school.name} has no substantial third-party review presence we can verify.
            </p>
          )}
          <div className="flex flex-wrap gap-6 text-sm text-slate-300">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Meets your state&apos;s minimum
            </span>
            {school.courtAcceptance && (
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> {school.courtAcceptance}
              </span>
            )}
            {school.mobileApp && (
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" /> Mobile app
              </span>
            )}
            {school.certificateDelivery && (
              <span className="flex items-center gap-1.5">
                <Send className="w-4 h-4" /> {school.certificateDelivery} delivery
              </span>
            )}
            {school.founded && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> Founded {school.founded}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10 grid lg:grid-cols-3 gap-10">
        {/* Main Content — min-w-0 lets the wide competitor table scroll inside its
            overflow-x-auto wrapper instead of forcing this grid column (and the whole
            page) wider than the viewport on mobile. */}
        <div className="min-w-0 lg:col-span-2 space-y-10">
          {/* Quick Summary */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Quick Summary</h2>
            {school.bestFor && (
              <p className="text-slate-700 font-medium mb-3">
                Best for: {school.bestFor}
              </p>
            )}
            <p className="text-slate-600 leading-relaxed mb-6">{school.tagline}</p>
            <div className="grid sm:grid-cols-2 gap-6">
              {school.pros.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 font-semibold text-green-700 mb-2">
                    <ThumbsUp className="w-4 h-4" /> Pros
                  </h3>
                  <ul className="space-y-1.5">
                    {school.pros.map((pro) => (
                      <li key={pro} className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {school.cons.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 font-semibold text-red-700 mb-2">
                    <ThumbsDown className="w-4 h-4" /> Cons
                  </h3>
                  <ul className="space-y-1.5">
                    {school.cons.map((con) => (
                      <li key={con} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="w-4 h-4 text-red-400 mt-0.5 shrink-0 text-center">&minus;</span>
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>

          {/* Our Full Review — long-form narrative from the Notion page body.
              Rendered only when written; sits between the quick summary and pricing. */}
          {reviewBody.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Full Review</h2>
              <ReviewBody blocks={reviewBody} />
            </section>
          )}

          {/* Pricing */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Pricing</h2>
            <div className="bg-slate-50 rounded-lg p-6">
              <p className="text-slate-600 mb-3">
                Prices vary by state. Select your state above to see {school.name}&apos;s exact price for your location.
              </p>
              <ul className="text-sm text-slate-600 space-y-1">
                {school.moneyBackGuarantee && (
                  <li className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-accent" /> Money-back guarantee included
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accent" /> Certificate included in price
                </li>
              </ul>
            </div>
          </section>

          {/* Feature Comparison */}
          {competitors.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                How {school.name} Compares
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="text-left py-3 pr-4 font-semibold text-slate-700">Feature</th>
                      <th className="py-3 px-4 font-semibold text-accent">{school.name}</th>
                      {competitors.map((c) => (
                        <th key={c.id} className="py-3 px-4 font-semibold text-slate-700">{c.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: "Price", getValue: () => "Varies by state" },
                      { label: "TSP Score", getValue: (s: typeof school) => s.tspScore != null ? `${s.tspScore.toFixed(1)}/5` : "—" },
                      { label: "Course Length", getValue: () => "Set by your state" },
                      { label: "Mobile App", getValue: (s: typeof school) => s.mobileApp ? "Yes" : "No" },
                      { label: "Money-Back Guarantee", getValue: (s: typeof school) => s.moneyBackGuarantee ? "Yes" : "No" },
                      { label: "Court Acceptance", getValue: (s: typeof school) => s.courtAcceptance ?? "—" },
                    ].map((row) => (
                      <tr key={row.label} className="border-b border-slate-100">
                        <td className="py-3 pr-4 font-medium text-slate-700">{row.label}</td>
                        <td className="py-3 px-4 text-center font-semibold text-accent">{row.getValue(school)}</td>
                        {competitors.map((c) => (
                          <td key={c.id} className="py-3 px-4 text-center text-slate-600">{row.getValue(c)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Verdict */}
          <section className="bg-slate-50 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Our Verdict</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              {school.name} is a{" "}
              {school.tspScore != null && school.tspScore >= 4.5 ? "top-tier" : school.tspScore != null && school.tspScore >= 4.0 ? "solid" : "capable"}{" "}
              choice for online traffic school.{" "}
              {school.tspScore != null && (
                <>
                  Our TSP Score is {school.tspScore.toFixed(1)}/5 (
                  <a href="/methodology" className="text-accent underline">how we score</a>).{" "}
                </>
              )}
              {school.bestFor && <>It&apos;s best for {school.bestFor.toLowerCase()}.</>}
            </p>
            <AffiliateButton school={school} />
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-6 sticky top-6">
            <div className="text-center mb-4">
              <div className="text-lg font-semibold text-slate-700">Prices vary by state</div>
            </div>
            <AffiliateButton school={school} />
            {school.ratings.length > 0 || school.bbb ? (
              <div className="mt-4">
                <p className="text-xs text-slate-400 mb-1">
                  Third-party ratings{asOf ? ` (as of ${asOf})` : ""}, attributed:
                </p>
                <MultiRating ratings={school.ratings} bbb={school.bbb} layout="vertical" />
              </div>
            ) : null}
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" /> Course length set by your state
              </li>
              {school.stateCodes.length > 0 && (
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-slate-400" />
                  {school.stateCodes.includes("all") ? "All 50 states" : `${school.stateCodes.length} states`}
                </li>
              )}
              {school.moneyBackGuarantee && (
                <li className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-400" /> Money-back guarantee
                </li>
              )}
              {school.website && (
                <li>
                  <a
                    href={trackerUrl(school.slug, { sourcePageId: school.id, src: "review" }) ?? school.website}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="flex items-center gap-2 text-accent hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" /> Official website
                  </a>
                </li>
              )}
            </ul>
            <a
              href="/methodology"
              className="mt-4 block text-center text-sm text-accent hover:underline"
            >
              How we score schools
            </a>
          </div>
        </aside>
      </div>
    </>
  );
}
