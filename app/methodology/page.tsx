import { Metadata } from "next";
import { CheckCircle, BookOpen, DollarSign, Map, FileCheck, LifeBuoy, History } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Dimension = {
  icon: LucideIcon;
  title: string;
  weight: number;
  desc: string;
  bands?: string[];
};

export const metadata: Metadata = {
  title: "How We Score Traffic Schools — The TSP Score Methodology",
  description:
    "The TSP Score is our own independent, six-dimension rating for online traffic schools. See exactly what we measure, how each dimension is weighted, and our independence commitment.",
  alternates: { canonical: "https://www.trafficschoolpicker.com/methodology" },
};

const DIMENSIONS: Dimension[] = [
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
    title: "State fit",
    weight: 15,
    desc: "How well the course serves your state: whether the content is genuinely built for the state's program rather than a generic national course, and whether completing it actually earns the state's real benefit (dismissal, point credit, or discount) where the school sells it.",
    bands: [
      "5.0 — Holds its own state license or approval and the course is built for that state's program; qualifies for the benefit everywhere it's sold.",
      "4.0–4.5 — State-specific versions per state (correct hours, correct program framing, state-labeled courses); qualifies where sold, with at most minor generic patches.",
      "3.0–3.5 — Broadly generic course adapted per state; qualifies in most states sold, with known mismatches or unverifiable qualification in some.",
      "2.0–2.5 — Substantially generic, or sold in states where it does not earn the state's benefit.",
      "1.0 — Marketed in states where it cannot deliver the promised benefit.",
    ],
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
    bands: [
      "5 = 20+ years operating with a large, verifiable public record",
      "4 = 10–20 years or a strong verifiable record",
      "3.5 = around 10 years or a modest verifiable record",
      "3 = established but thin public record",
      "2 = short history or no verifiable record",
    ],
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
                {d.bands && (
                  <ul className="mt-3 space-y-1.5 border-t border-slate-200 pt-3">
                    {d.bands.map((b) => (
                      <li key={b} className="text-sm text-slate-500 leading-snug">
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
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
          <p className="text-slate-700 leading-relaxed mb-4">
            We list schools in TSP Score order, highest first; when two schools tie on
            score, the lower price ranks first. (Ordering updated September 2026.)
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

        <h2 className="text-2xl font-bold text-slate-900 mb-3 mt-10">Changelog</h2>
        <p className="text-slate-600 leading-relaxed">
          <strong>Updated August 2026:</strong> the State coverage dimension is now State
          fit. Coverage rewarded how many states a school sells in, which tells you nothing
          about the course you&apos;ll take in yours. State fit scores what does: whether the
          course is genuinely built for your state&apos;s program, and whether it earns your
          state&apos;s actual benefit where it&apos;s sold. Same 15% weight. Scores were
          re-derived under the new definition on this date.
        </p>
      </div>
    </section>
  );
}
