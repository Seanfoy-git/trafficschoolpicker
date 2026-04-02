import { Metadata } from "next";
import { notFound } from "next/navigation";
import { schools, getSchoolBySlug, getReviewsForSchool } from "@/lib/schools";
import { RatingStars } from "@/components/RatingStars";
import { Badge } from "@/components/Badge";
import { AffiliateButton } from "@/components/AffiliateButton";
import {
  Clock,
  CheckCircle,
  Smartphone,
  Shield,
  Send,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  Star,
} from "lucide-react";
import Link from "next/link";

type Props = {
  params: Promise<{ "school-slug": string }>;
};

export async function generateStaticParams() {
  return schools.map((s) => ({ "school-slug": s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { "school-slug": slug } = await params;
  const school = getSchoolBySlug(slug);
  if (!school) return {};

  return {
    title: `${school.name} Review (2025) — Is It Worth It?`,
    description: `Detailed review of ${school.name} online traffic school. Price: $${school.price}. Rating: ${school.rating}/5 from ${school.reviewCount.toLocaleString()} reviews. See pros, cons, and our verdict.`,
    alternates: {
      canonical: `https://trafficschoolpicker.com/reviews/${school.slug}`,
    },
    openGraph: {
      title: `${school.name} Review — TrafficSchoolPicker`,
      description: `Is ${school.name} worth it? Read our in-depth review with pricing, features, and student feedback.`,
    },
  };
}

export default async function ReviewPage({ params }: Props) {
  const { "school-slug": slug } = await params;
  const school = getSchoolBySlug(slug);
  if (!school) notFound();

  const reviews = getReviewsForSchool(slug);
  const competitors = schools.filter((s) => s.id !== school.id).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: {
      "@type": "EducationalOrganization",
      name: school.name,
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: school.rating,
      bestRating: 5,
    },
    author: {
      "@type": "Organization",
      name: "TrafficSchoolPicker",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
          <div className="mb-4">
            <RatingStars
              rating={school.rating}
              count={school.reviewCount}
              size="lg"
            />
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-slate-300">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {school.completionTimeHours} hours
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              {school.courtAcceptance === "all"
                ? "All courts"
                : school.courtAcceptance === "most"
                ? "Most courts"
                : "Some courts"}
            </span>
            {school.mobileApp && (
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" /> Mobile app
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Send className="w-4 h-4" />
              {school.certificateDelivery === "electronic"
                ? "Electronic delivery"
                : school.certificateDelivery === "mail"
                ? "Mail delivery"
                : "Electronic + mail"}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Founded {school.founded}
            </span>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10 grid lg:grid-cols-3 gap-10">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-10">
          {/* Quick Summary */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Quick Summary
            </h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              {school.longDescription}
            </p>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <h3 className="flex items-center gap-2 font-semibold text-green-700 mb-2">
                  <ThumbsUp className="w-4 h-4" /> Pros
                </h3>
                <ul className="space-y-1.5">
                  {school.pros.map((pro) => (
                    <li
                      key={pro}
                      className="flex items-start gap-2 text-sm text-slate-600"
                    >
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="flex items-center gap-2 font-semibold text-red-700 mb-2">
                  <ThumbsDown className="w-4 h-4" /> Cons
                </h3>
                <ul className="space-y-1.5">
                  {school.cons.map((con) => (
                    <li
                      key={con}
                      className="flex items-start gap-2 text-sm text-slate-600"
                    >
                      <span className="w-4 h-4 text-red-400 mt-0.5 shrink-0 text-center">
                        &minus;
                      </span>
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Pricing</h2>
            <div className="bg-slate-50 rounded-lg p-6">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-3xl font-bold text-slate-900">
                  ${school.price.toFixed(2)}
                </span>
                {school.originalPrice && (
                  <span className="text-lg text-slate-400 line-through">
                    ${school.originalPrice.toFixed(2)}
                  </span>
                )}
                {school.originalPrice && (
                  <span className="text-sm font-semibold text-accent">
                    Save $
                    {(school.originalPrice - school.price).toFixed(2)}
                  </span>
                )}
              </div>
              <ul className="text-sm text-slate-600 space-y-1">
                {school.moneyBackGuarantee && (
                  <li className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-accent" />
                    Money-back guarantee included
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accent" />
                  Certificate included in price
                </li>
              </ul>
            </div>
          </section>

          {/* Feature Comparison */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              How {school.name} Compares
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-3 pr-4 font-semibold text-slate-700">
                      Feature
                    </th>
                    <th className="py-3 px-4 font-semibold text-accent">
                      {school.name}
                    </th>
                    {competitors.map((c) => (
                      <th
                        key={c.id}
                        className="py-3 px-4 font-semibold text-slate-700"
                      >
                        {c.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      label: "Price",
                      getValue: (s: typeof school) =>
                        `$${s.price.toFixed(2)}`,
                    },
                    {
                      label: "Rating",
                      getValue: (s: typeof school) =>
                        `${s.rating}/5`,
                    },
                    {
                      label: "Completion Time",
                      getValue: (s: typeof school) =>
                        `${s.completionTimeHours}h`,
                    },
                    {
                      label: "Mobile App",
                      getValue: (s: typeof school) =>
                        s.mobileApp ? "Yes" : "No",
                    },
                    {
                      label: "Money-Back Guarantee",
                      getValue: (s: typeof school) =>
                        s.moneyBackGuarantee ? "Yes" : "No",
                    },
                    {
                      label: "Court Acceptance",
                      getValue: (s: typeof school) =>
                        s.courtAcceptance === "all"
                          ? "All courts"
                          : s.courtAcceptance === "most"
                          ? "Most courts"
                          : "Some courts",
                    },
                  ].map((row) => (
                    <tr key={row.label} className="border-b border-slate-100">
                      <td className="py-3 pr-4 font-medium text-slate-700">
                        {row.label}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-accent">
                        {row.getValue(school)}
                      </td>
                      {competitors.map((c) => (
                        <td
                          key={c.id}
                          className="py-3 px-4 text-center text-slate-600"
                        >
                          {row.getValue(c)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Features */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Course Features
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {school.features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg px-4 py-3"
                >
                  <CheckCircle className="w-4 h-4 text-accent shrink-0" />
                  {feature}
                </div>
              ))}
            </div>
          </section>

          {/* Student Reviews */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Student Reviews
            </h2>
            <div className="space-y-4">
              {reviews.map((review, i) => (
                <div
                  key={i}
                  className="border border-slate-200 rounded-lg p-5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-semibold text-slate-900">
                        {review.name}
                      </span>
                      <span className="text-sm text-slate-500 ml-2">
                        {review.state}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {review.date}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= review.rating
                            ? "text-highlight fill-highlight"
                            : "text-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600">{review.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Verdict */}
          <section className="bg-slate-50 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Our Verdict
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              {school.name} is a{" "}
              {school.rating >= 4.5
                ? "top-tier"
                : school.rating >= 4.0
                ? "solid"
                : "decent"}{" "}
              choice for online traffic school.{" "}
              {school.badge === "best-value"
                ? "It offers the best value for money among the schools we reviewed."
                : school.badge === "top-rated"
                ? "It earns our highest rating for overall quality and user experience."
                : school.badge === "editors-choice"
                ? "It's our editor's choice for the most comprehensive learning experience."
                : school.badge === "fastest"
                ? "It's the fastest option for drivers who want to complete their course quickly."
                : `With a ${school.rating}/5 rating from ${school.reviewCount.toLocaleString()} reviews, it has a strong track record.`}
            </p>
            <AffiliateButton
              school={school}
              state="general"
              source="review-verdict"
            >
              Enroll at {school.name} &rarr;
            </AffiliateButton>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-6 sticky top-6">
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-slate-900 mb-1">
                ${school.price.toFixed(2)}
              </div>
              {school.originalPrice && (
                <div className="text-sm text-slate-400 line-through">
                  ${school.originalPrice.toFixed(2)}
                </div>
              )}
            </div>
            <AffiliateButton
              school={school}
              state="general"
              source="review-sidebar"
            />
            <div className="mt-4 text-center">
              <RatingStars rating={school.rating} count={school.reviewCount} />
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                {school.completionTimeHours} hours to complete
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-slate-400" />
                {school.states.length === 50
                  ? "All 50 states"
                  : `${school.states.length} states`}
              </li>
              {school.moneyBackGuarantee && (
                <li className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-400" />
                  Money-back guarantee
                </li>
              )}
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}
