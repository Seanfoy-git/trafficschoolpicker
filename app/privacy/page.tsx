import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — TrafficSchoolPicker",
  description:
    "How TrafficSchoolPicker collects, uses, and shares information when you use the site.",
  alternates: { canonical: "https://www.trafficschoolpicker.com/privacy" },
};

const UPDATED = "August 13, 2026";

export default function PrivacyPage() {
  return (
    <section className="py-12 md:py-16">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
          Privacy Policy
        </h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: {UPDATED}</p>

        <div className="space-y-8 text-slate-600 leading-relaxed">
          <div>
            <p>
              This Privacy Policy explains how PellucidMedia LLC (&quot;we,&quot;
              &quot;us&quot;), which operates TrafficSchoolPicker.com (the
              &quot;Site&quot;), handles information when you visit. We keep this
              simple: the Site does not require an account, and we do not ask you to
              provide personal details to browse or compare schools.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              Information we collect
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Usage and device data</strong> — standard analytics such as
                pages viewed, referring page, approximate location (from IP), browser
                and device type, and interactions, collected automatically.
              </li>
              <li>
                <strong>Outbound click data</strong> — when you click a school or
                affiliate link, we generate a random per-click identifier (a UUID) and
                pass it to the affiliate network as a tracking sub-ID so that a
                resulting enrollment can be attributed to us for commission. We also
                log that click (the school, the state page it came from, that
                identifier, and a timestamp) in our own store, which auto-expires
                after a limited retention period. We do not attach your name to this.
              </li>
              <li>
                <strong>Information you send us</strong> — if you email us, we receive
                what you choose to include.
              </li>
            </ul>
            <p className="mt-3">
              We do not knowingly collect payment information — purchases happen on
              the provider&apos;s own website under their privacy policy.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              Cookies and analytics tools
            </h2>
            <p>
              The Site uses cookies and similar technologies, and third-party
              services that set their own, including:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li>
                <strong>Google</strong> (Google Analytics / Google Ads tag) — traffic
                measurement and conversion tracking;
              </li>
              <li>
                <strong>Vercel Web Analytics</strong> — privacy-friendly, aggregate
                traffic measurement; and
              </li>
              <li>
                <strong>Our own click tracking</strong> — a first-party redirect used
                to count outbound clicks to providers.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              How we use information
            </h2>
            <p>
              We use this information to operate and improve the Site, understand
              which content and comparisons are helpful, measure the performance of
              our links and marketing, and keep the Site secure. We do{" "}
              <strong>not</strong> sell your personal information.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              How information is shared
            </h2>
            <p>
              We share information with the analytics and infrastructure providers
              named above so they can perform those services for us, and with
              affiliate networks when you click an affiliate link (so a referral can
              be attributed). We may disclose information if required by law or to
              protect the Site. We do not otherwise sell or rent personal
              information.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Your choices</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                You can block or delete cookies in your browser settings (some
                features may then work differently).
              </li>
              <li>
                You can opt out of Google Analytics with Google&apos;s{" "}
                <a
                  href="https://tools.google.com/dlpage/gaoptout"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  opt-out browser add-on
                </a>
                .
              </li>
              <li>
                Depending on where you live (for example, California and certain
                other states), you may have rights to access, delete, or opt out of
                certain uses of your information. Contact us to make a request.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              Third-party websites
            </h2>
            <p>
              When you follow a link to a course provider or other site, that site&apos;s
              own privacy policy applies. We are not responsible for the privacy
              practices of sites we do not operate.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              Children&apos;s privacy
            </h2>
            <p>
              The Site is intended for adults and is not directed to children. We do
              not knowingly collect personal information from children.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              Changes and contact
            </h2>
            <p>
              We may update this Policy from time to time; the &quot;Last updated&quot;
              date above reflects the latest version. Questions or privacy requests?
              Email{" "}
              <a
                href="mailto:privacy@trafficschoolpicker.com"
                className="text-accent hover:underline"
              >
                privacy@trafficschoolpicker.com
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
