import type { Metadata } from "next";
import { Newsreader, Libre_Franklin, JetBrains_Mono } from "next/font/google";
import { ORGANIZATION_ID, buildBreadcrumbList } from "@/lib/structured-data";
import { BODY_TOP, BODY_SOURCES } from "./content";
import { StateRequestForm } from "./StateRequestForm";
import "./out-of-state.css";

const SITE = "https://www.trafficschoolpicker.com";
const PATH = "/out-of-state-ticket";
const URL = `${SITE}${PATH}`;

// dateModified reflects the actual last content edit, NOT the build date (same
// discipline as the sitemap's STATIC_LASTMOD). Bump this by hand when the page's
// facts change — e.g. when a public-records answer comes back for an open question.
const DATE_PUBLISHED = "2026-08-27";
const DATE_MODIFIED = "2026-08-27";

// The page's own editorial faces, self-hosted via next/font and exposed as CSS
// variables consumed by out-of-state.css (all three are variable fonts → no weight).
const serif = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-oost-serif", display: "swap" });
const sans = Libre_Franklin({ subsets: ["latin"], variable: "--font-oost-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-oost-mono", display: "swap" });

const DESCRIPTION =
  "A ticket in a state you're not licensed in: whether traffic school helps, whether you can even take it, and what your home state does with the points — every claim sourced to statute, across ten states.";

export const metadata: Metadata = {
  title: "Got a ticket in a state you're not licensed in?",
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    title: "Got a ticket in a state you're not licensed in?",
    description: DESCRIPTION,
    url: URL,
    siteName: "TrafficSchoolPicker",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Got a ticket in a state you're not licensed in?",
    description: DESCRIPTION,
  },
};

export default function OutOfStateTicketPage() {
  // TechArticle: a sourced technical reference. datePublished/dateModified are real
  // content dates; author + publisher reference the site-wide Organization node.
  // No FAQPage — Google restricted FAQ rich results to gov/health in 2023 (§Schema).
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "You got a ticket in a state you're not licensed in",
    description: DESCRIPTION,
    datePublished: DATE_PUBLISHED,
    dateModified: DATE_MODIFIED,
    mainEntityOfPage: { "@type": "WebPage", "@id": URL },
    author: { "@id": ORGANIZATION_ID },
    publisher: { "@id": ORGANIZATION_ID },
  };
  const breadcrumbSchema = buildBreadcrumbList([
    { name: "Home", path: "/" },
    { name: "Out-of-state ticket", path: PATH },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className={`oost ${serif.variable} ${sans.variable} ${mono.variable}`}>
        <div className="page">
          <div dangerouslySetInnerHTML={{ __html: BODY_TOP }} />
          <StateRequestForm />
          <div dangerouslySetInnerHTML={{ __html: BODY_SOURCES }} />
        </div>
      </div>
    </>
  );
}
