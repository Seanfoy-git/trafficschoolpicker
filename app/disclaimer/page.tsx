import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Disclaimer — TrafficSchoolPicker",
  description:
    "Important disclaimers about TrafficSchoolPicker: pricing accuracy, court acceptance, affiliate relationships, and the informational nature of this site.",
  alternates: { canonical: "https://www.trafficschoolpicker.com/disclaimer" },
};

const UPDATED = "August 13, 2026";

export default function DisclaimerPage() {
  return (
    <section className="py-12 md:py-16">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
          Disclaimer
        </h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: {UPDATED}</p>

        <div className="space-y-8 text-slate-600 leading-relaxed">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              An independent comparison site
            </h2>
            <p>
              TrafficSchoolPicker.com (the &quot;Site&quot;), operated by
              PellucidMedia LLC, is an independent comparison and review service. We are not a traffic school, driving
              school, law firm, court, insurer, or government or regulatory agency,
              and we are not affiliated with, endorsed by, or acting on behalf of
              any of them. Course providers named on the Site are the trademarks of
              their respective owners.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              Not legal advice
            </h2>
            <p>
              All content on the Site is provided for general informational
              purposes only and is not legal, financial, or professional advice,
              and does not create any attorney–client or professional relationship.
              Traffic laws, court procedures, and eligibility rules vary by state,
              county, and individual case, and change over time. For advice about
              your situation, consult a qualified attorney and the court listed on
              your citation.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              Pricing and promotional offers
            </h2>
            <p>
              Prices, discounts, coupon codes, and time-limited offers shown on the
              Site are gathered from provider websites on a periodic basis. They may
              be out of date, may change or expire without notice, and may differ
              from the price or terms you see at the provider&apos;s checkout —
              including because of state fees, taxes, course options, or promotions
              we have not captured. Any figures we display are estimates for
              comparison only. Always confirm the current price and terms on the
              provider&apos;s own website before you purchase. We are not responsible
              for pricing errors or for offers that have ended.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              No guarantee of court acceptance or outcome
            </h2>
            <p>
              We list schools that are licensed or approved by state regulatory
              agencies (the DMV or its equivalent). Whether an online course is
              accepted for ticket dismissal, point reduction, or an insurance
              discount depends on your state&apos;s rules and the specific court or
              agency handling your matter, and can vary by county and by case. We do
              not guarantee that any course will be accepted, that your ticket will
              be dismissed, that points will be removed, or any other result. Verify
              your eligibility with the court on your citation before enrolling.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              Accuracy of information
            </h2>
            <p>
              We work to keep information current and accurate, including ratings we
              aggregate from third-party review platforms, but we make no warranty
              that any content is complete, current, or error-free. Content is
              provided &quot;as is.&quot; Reviews and ratings reflect third-party
              sources and individual opinions, not our endorsement of any outcome.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              Affiliate disclosure
            </h2>
            <p>
              Some links on the Site are affiliate links. If you click one and enroll
              or purchase, we may earn a commission from the provider, at no
              additional cost to you. We may have financial relationships with some
              of the schools we review. This never changes the price you pay and does
              not influence our editorial rankings, ratings, or reviews, which are
              based on our{" "}
              <Link href="/methodology" className="text-accent hover:underline">
                published methodology
              </Link>
              . This disclosure is made in
              accordance with U.S. Federal Trade Commission guidelines.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              Third-party websites
            </h2>
            <p>
              The Site links to third-party websites we do not control. We are not
              responsible for the content, products, pricing, privacy practices, or
              accuracy of any third-party site, and a link is not an endorsement.
              Your dealings with any provider are solely between you and that
              provider.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Contact</h2>
            <p>
              Questions about this disclaimer? Email{" "}
              <a
                href="mailto:legal@trafficschoolpicker.com"
                className="text-accent hover:underline"
              >
                legal@trafficschoolpicker.com
              </a>
              . See also our{" "}
              <Link href="/terms" className="text-accent hover:underline">
                Terms of Use
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-accent hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
