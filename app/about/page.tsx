import { Metadata } from "next";
import { CheckCircle, DollarSign, Star, Clock, Shield, BarChart3 } from "lucide-react";

export const metadata: Metadata = {
  title: "How We Rank Traffic Schools — Our Methodology",
  description:
    "Learn how TrafficSchoolPicker independently evaluates and ranks online traffic schools based on price, quality, user reviews, and court acceptance.",
  alternates: { canonical: "https://trafficschoolpicker.com/about" },
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
            <div className="space-y-4">
              {[
                {
                  icon: DollarSign,
                  title: "Price (25%)",
                  desc: "We compare current prices including any promotions. Lower prices rank higher. We also consider whether the price includes the certificate or if there are hidden fees.",
                },
                {
                  icon: Star,
                  title: "User Ratings (25%)",
                  desc: "We aggregate ratings from thousands of verified student reviews across multiple platforms. Schools with consistently high ratings rank higher.",
                },
                {
                  icon: BarChart3,
                  title: "Course Quality (20%)",
                  desc: "Our editorial team evaluates course content for depth, accuracy, engagement, and production value. Video-based and interactive courses generally score higher.",
                },
                {
                  icon: Shield,
                  title: "Court Acceptance (15%)",
                  desc: "We verify which courts and DMVs accept each school. Schools approved in all 50 states or with wider court acceptance rank higher.",
                },
                {
                  icon: Clock,
                  title: "Features & Experience (15%)",
                  desc: "We evaluate mobile app availability, certificate delivery speed, customer support quality, money-back guarantees, and overall user experience.",
                },
              ].map((criterion) => (
                <div
                  key={criterion.title}
                  className="flex gap-4 bg-slate-50 rounded-lg p-5"
                >
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <criterion.icon className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {criterion.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {criterion.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
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
