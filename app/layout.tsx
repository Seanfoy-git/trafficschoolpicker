import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "TrafficSchoolPicker — Compare Online Traffic Schools & Save",
    template: "%s | TrafficSchoolPicker",
  },
  description:
    "Compare court-approved online traffic schools by price, speed, and ratings. Find the best traffic school in your state and dismiss your ticket today.",
  metadataBase: new URL("https://trafficschoolpicker.com"),
  openGraph: {
    type: "website",
    siteName: "TrafficSchoolPicker",
    title: "TrafficSchoolPicker — Compare Online Traffic Schools & Save",
    description:
      "Compare court-approved online traffic schools by price, speed, and ratings across all 50 US states.",
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
      <body className="min-h-full flex flex-col bg-white text-slate-800">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
