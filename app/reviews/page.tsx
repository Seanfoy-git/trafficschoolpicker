import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getAllSchools } from "@/lib/notion";
import { buildBreadcrumbList } from "@/lib/structured-data";
import { TrustBar } from "@/components/TrustBar";
import { MultiRating } from "@/components/MultiRating";
import { RatingStars } from "@/components/RatingStars";
import { Badge } from "@/components/Badge";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Online Traffic School Reviews — Independent & In-Depth",
  description:
    "Independent, in-depth reviews of every online traffic school we cover — ratings, pros and cons, pricing, and who each course is best for.",
  alternates: { canonical: "https://www.trafficschoolpicker.com/reviews" },
  openGraph: {
    title: "Online Traffic School Reviews — TrafficSchoolPicker",
    description:
      "Independent, in-depth reviews of every online traffic school we cover — ratings, pros and cons, and who each course is best for.",
    url: "https://www.trafficschoolpicker.com/reviews",
    siteName: "TrafficSchoolPicker",
    type: "website",
  },
};

export default async function ReviewsHubPage() {
  // Best-reviewed first (tier, then rating), so the hub leads with our strongest picks.
  const schools = [...(await getAllSchools())].sort(
    (a, b) => a.tier - b.tier || (b.rating ?? 0) - (a.rating ?? 0) || a.name.localeCompare(b.name)
  );

  const breadcrumbSchema = buildBreadcrumbList([
    { name: "Home", path: "/" },
    { name: "Reviews", path: "/reviews" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <section className="bg-primary text-white py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Online Traffic School Reviews
          </h1>
          <p className="text-lg text-slate-300 max-w-3xl">
            Independent, in-depth reviews of the {schools.length} online traffic schools we cover —
            ratings, pros and cons, pricing, and who each course is best for.
          </p>
        </div>
      </section>

      <TrustBar />

      <section className="py-12 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 gap-6">
            {schools.map((school) => {
              const snippet = school.tagline || school.bestFor || "";
              return (
                <div
                  key={school.id}
                  className="flex flex-col bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h2 className="text-lg font-bold text-slate-900">
                      <Link href={`/reviews/${school.slug}`} className="hover:text-accent transition-colors">
                        {school.name}
                      </Link>
                    </h2>
                    {school.badge && <Badge type={school.badge} />}
                  </div>

                  {school.ratings.length > 0 || school.bbb ? (
                    <MultiRating ratings={school.ratings} bbb={school.bbb} />
                  ) : school.rating !== null ? (
                    <RatingStars rating={school.rating} count={school.reviewCount ?? undefined} />
                  ) : null}

                  {snippet && <p className="text-sm text-slate-600 mt-3">{snippet}</p>}

                  <Link
                    href={`/reviews/${school.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-accent mt-auto pt-4 underline"
                  >
                    Read the full {school.name} review <ArrowRight className="w-4 h-4 shrink-0" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
