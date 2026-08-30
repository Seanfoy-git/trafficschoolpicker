import { Metadata } from "next";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "How We Rank Traffic Schools — Our Methodology",
  description:
    "Learn how TrafficSchoolPicker independently evaluates and ranks online traffic schools based on price, quality, user reviews, and court acceptance.",
  alternates: { canonical: "https://www.trafficschoolpicker.com/about" },
};

export default function AboutPage() {
  return (
    <section className="py-12 md:py-16">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          How We Rank Schools
        </h1>
        <p className="text-lg text-slate-600 mb-10">
          TrafficSchoolPicker is an independent comparison site. Here&apos;s how we
          evaluate and rank every school we list.
        </p>

        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Our Ranking Criteria
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Every school we&apos;ve reviewed gets a <strong>TSP Score</strong>, our own
              independent rating built from six weighted dimensions: course experience,
              price and transparency, state coverage, certificate handling, support and
              guarantees, and track record. See the full rubric, the weights, and exactly
              how the score is computed on our{" "}
              <Link href="/methodology" className="text-accent hover:underline">
                scoring methodology
              </Link>{" "}
              page.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Editorial Independence
            </h2>
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-6">
              <p className="text-slate-700 leading-relaxed mb-4">
                TrafficSchoolPicker may earn affiliate commissions when you
                enroll in a school through our links. However, this{" "}
                <strong>never influences our rankings or recommendations</strong>.
              </p>
              <ul className="space-y-2">
                {[
                  "No school can pay for a higher ranking",
                  "We test and review every school independently",
                  "Our editorial team has final say on all rankings",
                  "We disclose affiliate relationships transparently",
                  "Negative reviews are published alongside positive ones",
                ].map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2 text-sm text-slate-600"
                  >
                    <CheckCircle className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              How We Stay Up to Date
            </h2>
            <p className="text-slate-600 leading-relaxed">
              We review and update our rankings quarterly. When a school changes
              its pricing, features, or court approval status, we update our data
              within one business day. If you notice any outdated information,
              please let us know so we can correct it promptly.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
