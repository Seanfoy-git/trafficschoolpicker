import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use — TrafficSchoolPicker",
  description:
    "The terms and conditions that govern your use of TrafficSchoolPicker.com.",
  alternates: { canonical: "https://www.trafficschoolpicker.com/terms" },
};

const UPDATED = "August 13, 2026";

export default function TermsPage() {
  return (
    <section className="py-12 md:py-16">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
          Terms of Use
        </h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: {UPDATED}</p>

        <div className="space-y-8 text-slate-600 leading-relaxed">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              1. Acceptance of these terms
            </h2>
            <p>
              These Terms of Use (&quot;Terms&quot;) govern your access to and use of
              TrafficSchoolPicker.com and its content (the &quot;Site&quot;), operated
              by PellucidMedia LLC (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
              By using the Site, you agree to these Terms and to our{" "}
              <Link href="/privacy" className="text-accent hover:underline">
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link href="/disclaimer" className="text-accent hover:underline">
                Disclaimer
              </Link>
              . If you do not agree, please do not use the Site.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              2. Informational purpose only
            </h2>
            <p>
              The Site is an independent comparison and review service provided for
              general informational purposes. It is not legal, financial, or
              professional advice, and using the Site does not create any
              professional relationship. Traffic-school eligibility, court
              acceptance, pricing, and outcomes vary by state, county, and case and
              change over time — verify details with the relevant provider and the
              court on your citation before acting. See our{" "}
              <Link href="/disclaimer" className="text-accent hover:underline">
                Disclaimer
              </Link>{" "}
              for details on pricing, offers, and court acceptance.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              3. Third-party providers and links
            </h2>
            <p>
              The Site describes and links to third-party course providers and other
              websites we do not operate or control. Any purchase, enrollment, or
              other transaction is solely between you and the provider, on that
              provider&apos;s terms. We are not a party to those transactions and are
              not responsible for the products, services, pricing, offers, content,
              or conduct of any third party. A link is not an endorsement.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              4. Acceptable use
            </h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li>use the Site for any unlawful purpose or in violation of these Terms;</li>
              <li>copy, scrape, republish, or resell Site content except as permitted by law;</li>
              <li>attempt to disrupt, overload, or gain unauthorized access to the Site or its systems; or</li>
              <li>misrepresent your affiliation with any person or entity.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              5. Intellectual property
            </h2>
            <p>
              The Site&apos;s original content, design, and compilation are owned by
              PellucidMedia LLC and protected by applicable laws. Product
              names, logos, and trademarks belong to their respective owners and are
              used for identification and comparison only.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              6. Affiliate relationships
            </h2>
            <p>
              We may earn a commission when you click certain links and enroll or
              purchase, at no additional cost to you. This does not influence our
              rankings or reviews. See our{" "}
              <Link href="/disclaimer" className="text-accent hover:underline">
                Disclaimer
              </Link>{" "}
              and{" "}
              <Link href="/methodology" className="text-accent hover:underline">
                methodology
              </Link>
              .
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              7. Disclaimers and limitation of liability
            </h2>
            <p>
              THE SITE AND ITS CONTENT ARE PROVIDED &quot;AS IS&quot; AND &quot;AS
              AVAILABLE,&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED,
              INCLUDING WARRANTIES OF ACCURACY, MERCHANTABILITY, OR FITNESS FOR A
              PARTICULAR PURPOSE. To the fullest extent permitted by law,
              TrafficSchoolPicker.com and its operators will not be liable for any
              indirect, incidental, consequential, or punitive damages, or for any
              loss arising from your use of the Site, reliance on its content, or any
              transaction with a third-party provider.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              8. Changes to these terms
            </h2>
            <p>
              We may update these Terms from time to time. Changes take effect when
              posted, and the &quot;Last updated&quot; date above will change.
              Continued use of the Site after an update means you accept the revised
              Terms.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              9. Governing law
            </h2>
            <p>
              These Terms are governed by the laws of the State of California and
              applicable U.S. federal law, without regard to conflict-of-laws
              principles. You agree that the state and federal courts located in
              California have exclusive jurisdiction over any dispute arising from
              these Terms or your use of the Site.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">10. Contact</h2>
            <p>
              Questions about these Terms? Email{" "}
              <a
                href="mailto:legal@trafficschoolpicker.com"
                className="text-accent hover:underline"
              >
                legal@trafficschoolpicker.com
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
