import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { validateSeoConfig } from "@/lib/seo-config";
import { ORG_WEBSITE_GRAPH } from "@/lib/structured-data";
import "./globals.css";

validateSeoConfig();

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.trafficschoolpicker.com"),
  title: {
    default: "TrafficSchoolPicker — Compare Online Traffic Schools",
    template: "%s | TrafficSchoolPicker",
  },
  description:
    "Compare online traffic school and defensive driving options for all 50 states and DC. Find the lowest price and enroll today.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    siteName: "TrafficSchoolPicker",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="impact-site-verification" content="7773539a-3df5-43dd-82e7-8d322626aced" />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18090793804"
          strategy="afterInteractive"
        />
        <Script id="google-ads" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'AW-18090793804');`}
        </Script>
      </head>
      <body className="min-h-full flex flex-col bg-white text-slate-800">
        {/* Sitewide Organization + WebSite entity graph — the single Organization
            definition; blog/review schema reference it by @id. Server-rendered on
            every page (same JSON-LD pattern as FaqSection). */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_WEBSITE_GRAPH) }}
        />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
