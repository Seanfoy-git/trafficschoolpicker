import { Metadata } from "next";
import { CheckCircle, BookOpen, DollarSign, Map, FileCheck, LifeBuoy, History } from "lucide-react";

export const metadata: Metadata = {
  title: "How We Score Traffic Schools — The TSP Score Methodology",
  description:
    "The TSP Score is our own independent, six-dimension rating for online traffic schools. See exactly what we measure, how each dimension is weighted, and our independence commitment.",
  alternates: { canonical: "https://www.trafficschoolpicker.com/methodology" },
};

const DIMENSIONS = [
  {
    icon: BookOpen,
    title: "Course experience",
    weight: 30,
    desc: "How good the course actually is to take: content depth and accuracy, how engaging and modern the lessons are, mobile and app quality, and how painless the flow is from sign-up to certificate.",
  },
  {
    icon: DollarSign,
    title: "Price & transparency",
    weight: 20,
    desc: "The real all-in price against the market, whether the certificate and required fees are included, and whether the checkout price is honest (no bait pricing or surprise add-ons).",
  },
  {
    icon: Map,
    title: "State coverage",
    weight: 15,
    desc: "How many states the school is approved in, and how well its course maps to each state's actual requirement rather than a generic national course.",
  },
  {
    icon: FileCheck,
    title: "Certificate handling",
    weight: 15,
    desc: "How the completion certificate reaches the court or DMV: electronic reporting versus mail, speed, reliability, and whether the driver has to chase it.",
  },
  {
    icon: LifeBuoy,
    title: "Support & guarantees",
    weight: 10,
    desc: "Customer support quality and hours, money-back and pass guarantees, and how the school handles problems when something goes wrong.",
  },
  {
    icon: History,
    title: "Track record",
    weight: 10,
    desc: "How long the school has operated, its standing with regulators and accreditation bodies, and the overall pattern of its verifiable public reputation.",
  },
];

export default function MethodologyPage() {
  return (
    <section className="py-12 md:py-16">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          How We Score Traffic Schools
        </h1>
        <p className="text-lg text-slate-600 mb-6">
          Our own rating is the <strong>TSP Score</strong>: an independent, six-dimension
          score from 1 to 5 that we compute ourselves. It is the only rating we present as
          ours. Third-party numbers from Trustpilot or Google may appear on a page, but
          only when clearly attributed to their source, never as our verdict.
        </p>

        <h2 className="text-2xl font-bold text-slate-900 mb-4">The six dimensions</h2>
        <p className="text-slate-600 mb-6">
          We score each school from 1 to 5 on each dimension below, then take the weighted
          mean and round to one decimal. Nothing is hardcoded: the score is always computed
          from the six sub-scores.
        </p>
        <div className="space-y-4 mb-10">
          {DIMENSIONS.map((d) => (
            <div key={d.title} className="flex gap-4 bg-slate-50 rounded-lg p-5">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <d.icon className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">
                  {d.title} <span className="text-accent">({d.weight}%)</span>
                </h3>
                <p className="text-sm text-slate-600 mt-1">{d.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-primary/5 border border-primary/10 rounded-lg p-6 mb-10">
          <h2 className="text-xl font-bold text-slate-900 mb-3">Independence</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            TrafficSchoolPicker is independent. Some links on the site are affiliate links,
            and we may earn a commission when you enroll through one, at no extra cost to
            you. That commission does not affect a school&apos;s TSP Score or where it ranks.
          </p>
          <ul className="space-y-2">
            {[
              "No school can pay for a higher score or ranking",
              "Commission rate is not one of the scored dimensions",
              "Schools with no affiliate program are scored on the same rubric",
              "Third-party ratings are shown attributed, never restated as ours",
              "We publish the weaknesses alongside the strengths",
            ].map((point) => (
              <li key={point} className="flex items-start gap-2 text-sm text-slate-600">
                <CheckCircle className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-3">
          Why some schools have no TSP Score
        </h2>
        <p className="text-slate-600 leading-relaxed">
          A school only gets a TSP Score once we have written a full independent review of
          it. Until then, its page shows the facts and any attributed third-party ratings,
          but no score of ours. We would rather show no score than a number we cannot stand
          behind.
        </p>
      </div>
    </section>
  );
}
