import type { Metadata } from "next";
import { getAllSchools } from "@/lib/notion";
import { SchoolsDirectoryTable } from "@/components/SchoolsDirectoryTable";
import { TrustBar } from "@/components/TrustBar";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "All Online Traffic Schools — Complete Directory",
  description:
    "Browse every court-approved online traffic school we review. Filter by state, sort by price, rating, or completion time to find the right fit.",
  alternates: {
    canonical: "https://www.trafficschoolpicker.com/schools",
  },
  openGraph: {
    title: "All Online Traffic Schools — TrafficSchoolPicker",
    description:
      "Full directory of court-approved online traffic schools. Filter by state, sort by price or rating.",
    url: "https://www.trafficschoolpicker.com/schools",
    siteName: "TrafficSchoolPicker",
    type: "website",
  },
};

export default async function SchoolsPage() {
  const schools = await getAllSchools();

  return (
    <>
      <section className="bg-primary text-white py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            All Online Traffic Schools
          </h1>
          <p className="text-lg text-slate-300 max-w-3xl">
            The complete list of {schools.length} online traffic schools we review.
            Filter by state, sort by price, rating, or completion time.
          </p>
        </div>
      </section>

      <TrustBar />

      <section className="py-12 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <SchoolsDirectoryTable schools={schools} />
        </div>
      </section>
    </>
  );
}
