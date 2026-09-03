import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getSchoolPricingForState,
  getStateInfo,
  getDirectoryForState,
  getStateRequirements,
  getSchoolVariantsForState,
  resolveStateContent,
  getLinkableStates,
  getAllSchools,
  getQuestionsForState,
} from "@/lib/notion";
import { buildComparisonItemList, buildVideoObject, buildBreadcrumbList, lowestDisplayedPrice, type VideoEntry } from "@/lib/structured-data";
import { STATE_SEO } from "@/lib/seo-config";
import { ticketCostFor, formatCost } from "@/lib/ticket-cost-study";
import { getNotionStateFaqs } from "@/lib/notion-faqs";
import { getStateBySlug, getAllStateSlugs } from "@/lib/state-utils";
import { SchoolCard } from "@/components/SchoolCard";
import { FaqSection } from "@/components/FaqSection";
import { DirectoryTable } from "@/components/DirectoryTable";
import { TrustBar } from "@/components/TrustBar";
import { OutOfStateCallout } from "@/components/OutOfStateCallout";
import { StateKeyFacts } from "@/components/StateKeyFacts";
import { NearbyStates } from "@/components/NearbyStates";
import { RelatedPosts } from "@/components/RelatedPosts";
import { StateQuestions } from "@/components/StateQuestions";
import Image from "next/image";
import {
  ShieldCheck,
  FileText,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  AlertTriangle,
  Info,
} from "lucide-react";

// Embedded state explainer videos — YouTube id plus the metadata VideoObject
// JSON-LD needs. uploadDate is each video's REAL publish datetime (full ISO 8601
// with timezone), taken verbatim from YouTube's own record (watch-page
// microformat / Data API snippet.publishedAt) — a date-only or shared value fails
// Google's video validation and can get the result dropped. Per video, never a
// shared constant.
const STATE_VIDEOS: Record<string, VideoEntry> = {
  "california":  { id: "kx_B0jgBjW4", uploadDate: "2026-04-16T11:58:39-07:00", duration: "PT3M16S", title: "How to Do California Traffic School Online and Keep Points Off Your Record" },
  "texas":       { id: "jAH-kz9dhF0", uploadDate: "2026-04-16T12:05:35-07:00", duration: "PT2M38S", title: "Texas Defensive Driving 2026 — How to Get Your Ticket Dismissed" },
  "florida":     { id: "1zM7hwLvWPc", uploadDate: "2026-04-16T11:47:53-07:00", duration: "PT2M42S", title: "Florida Traffic Ticket? Here's How to Keep Points Off Your License (2026)" },
  "new-york":    { id: "-eYzNko2dmQ", uploadDate: "2026-04-16T11:53:47-07:00", duration: "PT2M11S", title: "New York Speeding Ticket? Reduce Your Points & Insurance With PIRP (2026)" },
  "georgia":     { id: "VtNRogHhy_A", uploadDate: "2026-04-16T11:39:12-07:00", duration: "PT2M17S", title: "Georgia Speeding Ticket? The Super Speeder Law & How to Remove 7 Points (2026)" },
  "ohio":        { id: "IlMoa1atiBY", uploadDate: "2026-04-16T16:16:21-07:00", duration: "PT2M43S", title: "Ohio Traffic Ticket? Call Your Court First — Here's Why It Matters (2026)" },
  "arizona":     { id: "udlHdWl1cdM", uploadDate: "2026-04-22T16:30:14-07:00", duration: "PT2M29S", title: "Arizona Defensive Driving Course 2026 — How to Dismiss a Ticket Online" },
  // Replaces the prior 8Qtg9viSfbY, which YouTube had removed (oEmbed 404).
  "new-jersey":  { id: "Fa9M1EKNMV8", uploadDate: "2026-04-22T17:13:57-07:00", duration: "PT2M55S", title: "New Jersey Defensive Driving Course 2026 — What It Actually Does (And What It Doesn't)" },
};

export const revalidate = 86400;
// generateStaticParams returns ALL state slugs (getAllStateSlugs), so every valid
// state is prerendered. dynamicParams=false makes any unknown single-segment path
// (e.g. /foo) resolve to the STATIC not-found at the routing layer instead of
// invoking this route dynamically — which would SSR the layout (Footer's Notion
// fetch) just to notFound(). That dynamic path was the 1.7s uncached 404 in Crawl
// Stats; this turns those into fast, cacheable static 404s. Mirrors the [question]
// route, which already sets this.
export const dynamicParams = false;

type Props = { params: Promise<{ state: string }> };

export async function generateStaticParams() {
  return getAllStateSlugs().map((slug) => ({ state: slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state: stateSlug } = await params;
  const stateMeta = getStateBySlug(stateSlug);
  if (!stateMeta) return {};

  // Per-state OG card (public/images/states/<slug>.png) — real 1200x630 asset.
  const ogImage = `https://www.trafficschoolpicker.com/images/states/${stateMeta.slug}.png`;

  const seo = STATE_SEO[stateSlug];
  if (!seo) {
    return {
      title: `Online Traffic School in ${stateMeta.name} (2026)`,
      description: `Compare court-approved online traffic schools in ${stateMeta.name}. Find the lowest price and enroll today.`,
      alternates: { canonical: `https://www.trafficschoolpicker.com/${stateMeta.slug}` },
      openGraph: {
        title: `Online Traffic School in ${stateMeta.name} (2026)`,
        url: `https://www.trafficschoolpicker.com/${stateMeta.slug}`,
        siteName: "TrafficSchoolPicker",
        type: "website",
        images: [ogImage],
      },
      twitter: { card: "summary_large_image", images: [ogImage] },
    };
  }

  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: `https://www.trafficschoolpicker.com${seo.canonicalPath}` },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: `https://www.trafficschoolpicker.com${seo.canonicalPath}`,
      siteName: "TrafficSchoolPicker",
      type: "website",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [ogImage],
    },
  };
}

export default async function StatePage({ params }: Props) {
  const { state: stateSlug } = await params;
  const stateMeta = getStateBySlug(stateSlug);
  if (!stateMeta) notFound();

  const [schools, stateInfo, directory, notionFaqs, stateReqs, variants, linkableStates, stateQuestions] = await Promise.all([
    getSchoolPricingForState(stateMeta.code),
    getStateInfo(stateMeta.code),
    getDirectoryForState(stateMeta.name),
    getNotionStateFaqs(stateSlug),
    getStateRequirements(),
    getSchoolVariantsForState(stateMeta.code),
    getLinkableStates(),
    getQuestionsForState(stateSlug),
  ]);

  // ONE FAQ set per state, always derived from the state's own program model:
  // per-state JSON on the States DB (richest, state-specific) → standalone Notion
  // FAQ DB (legacy). No generic static fallback — a hand-written "in most states a
  // course dismisses your ticket" set would contradict the point-reduction /
  // court-discretion states, so a state with neither source simply shows no FAQ
  // (FaqSection renders nothing on an empty set) rather than a false generic one.
  const faqs =
    stateInfo?.stateFaq?.length
      ? stateInfo.stateFaq.map((f) => ({ question: f.q, answer: f.a }))
      : notionFaqs;

  const seo = STATE_SEO[stateSlug];
  const onlineStatus = stateInfo?.onlineStatus ?? "Unknown";
  // State grids are Tier 1 only. Tier 2 schools appear in the /schools directory only.
  const tier1 = schools.filter((s) => s.tier === 1);
  const year = new Date().getFullYear();
  // States that show the comparison grid get an "online traffic schools" H1;
  // court-program / in-person states get a neutral one (they sell no online course).
  const onlineComparisonStatus =
    onlineStatus === "Online — ticket dismissal" ||
    onlineStatus === "Online — insurance discount only" ||
    onlineStatus === "Online — court discretion" ||
    onlineStatus === "Online — point reduction";
  const h1 =
    seo?.h1 ??
    (onlineComparisonStatus
      ? `Online Traffic Schools in ${stateMeta.name} (${year})`
      : `Traffic School in ${stateMeta.name}`);

  // The comparison grid (and its Product/ItemList schema) render only for online
  // states that actually have tier-1 schools — the single gate shared below.
  // noPartnerOffer suppresses it even where the program exists (we list no offer):
  // the driver is pointed at the official approved-school list + directory instead.
  const noPartnerOffer = stateInfo?.noPartnerOffer ?? false;
  // Canonical ticket-cost figure (published states only) — the exact same number
  // the study blog and llms show, read from the single source. Null where the
  // study publishes no per-state figure; we never invent one.
  const ticketCost = ticketCostFor(stateMeta.code);
  const showComparison =
    !noPartnerOffer &&
    (onlineStatus === "Online — ticket dismissal" ||
      onlineStatus === "Online — insurance discount only" ||
      onlineStatus === "Online — court discretion" ||
      onlineStatus === "Online — point reduction") &&
    tier1.length > 0;

  // Resolve each tier-1 school's per-state content once and share it between the
  // cards and the JSON-LD, so the schema price can never drift from the card price.
  const tier1Resolved = tier1.map((school) => ({
    school,
    resolved: resolveStateContent(school, stateMeta.code, stateReqs, variants),
  }));

  // P12 badges (computed per page, not from the static Notion field): "Top Rated"
  // on the single highest-scored card (tier1Resolved is already sorted by TSP Score
  // descending, so it is the first scored one); "Lowest price" on the single cheapest
  // card by displayed price. A card can carry both.
  const topRatedId = tier1Resolved.find((x) => x.school.tspScore != null)?.school.id ?? null;
  let cheapestId: string | null = null;
  let minDisplayed = Infinity;
  for (const { school, resolved } of tier1Resolved) {
    if (resolved.price == null) continue;
    const disp =
      school.hasActiveOffer && school.salePrice != null && school.salePrice < resolved.price
        ? school.salePrice
        : resolved.price;
    if (disp < minDisplayed) {
      minDisplayed = disp;
      cheapestId = school.id;
    }
  }
  const badgesFor = (id: string): string[] => [
    ...(id === topRatedId ? ["Top Rated"] : []),
    ...(id === cheapestId ? ["Lowest price"] : []),
  ];

  // Slugs that have a /reviews/<slug> page. getAllSchools is build-memoized and
  // was already resolved by getSchoolPricingForState above, so this is a cache
  // hit — not an extra Notion query — and drives the Product url fallback.
  const reviewSlugs = showComparison
    ? new Set((await getAllSchools()).map((s) => s.slug))
    : new Set<string>();

  // Washington DC: the national comparison cards are shown for reference only —
  // DC point removal can be earned ONLY through the two DC DMV-approved providers
  // (see the DC callout below), so we suppress the Product/Offer markup that would
  // otherwise assert these cards are the DC-approved course (P10 Task 4).
  const comparisonSchema = showComparison && stateSlug !== "washington-dc"
    ? buildComparisonItemList(
        tier1Resolved,
        stateMeta.name,
        stateSlug,
        reviewSlugs,
        year,
        stateInfo?.courseHours ?? null,
        // No statewide approval program in court-discretion states: the Product
        // description must not claim the course is "state-approved" (P10 Task 4).
        onlineStatus !== "Online — court discretion"
      )
    : null;

  // VideoObject for the embedded explainer — emitted only when this state has a
  // video (same condition as the video section below). Description uses the
  // genuine on-page intro paragraph, falling back to a factual one-liner so it's
  // never empty (a VideoObject requirement).
  const video = STATE_VIDEOS[stateSlug] ?? null;
  const videoSchema = video
    ? buildVideoObject(
        video,
        stateInfo?.introParagraph?.trim() ||
          `A short explainer on ${stateMeta.name} traffic school: how the online course works and what it does for your ticket or license points.`,
        `https://www.trafficschoolpicker.com/${stateSlug}`
      )
    : null;

  // Breadcrumb: Home › {State}. The state page always exists at /{slug}, so both
  // crumbs resolve.
  const breadcrumbSchema = buildBreadcrumbList([
    { name: "Home", path: "/" },
    { name: stateMeta.name, path: `/${stateSlug}` },
  ]);

  // Lowest visible card price for the Key Facts "Typical cost" — only when the
  // comparison grid actually renders, so we never show a price for a state whose
  // cards aren't shown. Reuses the exact per-card/Offer price so it can't drift.
  const lowestPrice = showComparison ? lowestDisplayedPrice(tier1Resolved) : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* HERO */}
      <section className="bg-primary text-white py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-5 mb-3">
            <Image
              src={`/flags/${stateSlug}.png`}
              alt={`${stateMeta.name} state flag`}
              width={80}
              height={53}
              className="hidden md:block rounded shadow-md border border-white/20 object-cover shrink-0"
            />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {onlineStatus === "In-person only"
                ? `Traffic School in ${stateMeta.name}`
                : h1}
            </h1>
          </div>
          {/* Counts are computed from what the page actually renders: tier-1 cards in
              the grid (showComparison already accounts for noPartnerOffer + status),
              plus real DMV-directory rows. Never the raw pricing set, which includes
              tier-2 schools the grid doesn't show. */}
          {showComparison && (
            <p className="text-lg text-slate-300 max-w-3xl">
              Comparing {tier1.length} reviewed option
              {tier1.length !== 1 ? "s" : ""}
              {directory.length > 0 && <> from {tier1.length + directory.length} {stateMeta.name}-approved online schools</>}
            </p>
          )}
          {!showComparison && onlineStatus === "Online — insurance discount only" && (
            <p className="text-lg text-slate-300 max-w-3xl">
              Online courses in {stateMeta.name} are for insurance discounts, not ticket dismissal
            </p>
          )}
        </div>
      </section>

      <TrustBar lastVerified={stateInfo?.lastVerified} approvalLabel={stateInfo?.approvalLabel} />

      {/* Out-of-state signpost — this page is written for {State} licensees; flag
          drivers ticketed here on an out-of-state license to the reference guide. */}
      <section className="pt-6">
        <div className="max-w-5xl mx-auto px-4">
          <OutOfStateCallout stateName={stateMeta.name} stateSlug={stateSlug} />
        </div>
      </section>

      {/* KEY FACTS — scannable at-a-glance summary; the first substantive content
          on the page (targets featured snippets / AI Overviews / LLM extraction).
          The deeper "State Rules & Requirements" section stays lower down. */}
      <StateKeyFacts
        stateName={stateMeta.name}
        stateInfo={stateInfo}
        lowestPrice={lowestPrice}
        year={year}
      />

      {/* INTRO PARAGRAPH — state-specific lead-in for SEO uniqueness.
          Empty string is a deliberate signal that this state isn't populated yet;
          render nothing rather than a placeholder so we don't add boilerplate text. */}
      {stateInfo?.introParagraph && (
        <section className="py-8 bg-white border-b border-slate-100">
          <div className="max-w-3xl mx-auto px-4">
            <p className="text-base md:text-lg text-slate-700 leading-relaxed">
              {stateInfo.introParagraph}
            </p>
          </div>
        </section>
      )}

      {/* TRUE COST OF A TICKET — state-specific explainer on the real financial
          impact (fine + insurance hike + surcharges), between the intro lead-in
          and the school comparison. Renders only when the field is populated. */}
      {(stateInfo?.trueCostOfATicket || ticketCost?.allInCost) && (
        <section className="py-8 bg-white border-b border-slate-100">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              The True Cost of a Ticket in {stateMeta.name}
            </h2>
            {/* Canonical study figure — identical to the blog study and llms
                (lib/ticket-cost-study.ts). Shown only for published states. */}
            {ticketCost?.allInCost && (
              <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-lg bg-slate-50 border border-slate-200 px-5 py-4">
                <span className="text-3xl font-bold text-primary tabular-nums">
                  {formatCost(ticketCost.allInCost)}
                </span>
                <span className="text-sm text-slate-600">
                  estimated all-in cost of a first speeding ticket in {stateMeta.name}
                  {" "}(fine plus a three-year insurance surcharge).
                  {ticketCost.netSavings ? (
                    <> A state-approved course can avoid about {formatCost(ticketCost.netSavings)} of it.</>
                  ) : null}{" "}
                  <a href="/blog/true-cost-of-a-traffic-ticket" className="text-accent underline">
                    See the 2026 study.
                  </a>
                </span>
              </div>
            )}
            {stateInfo?.trueCostOfATicket && (
              <p className="text-base md:text-lg text-slate-700 leading-relaxed whitespace-pre-line">
                {stateInfo.trueCostOfATicket}
              </p>
            )}
          </div>
        </section>
      )}

      {/* STATUS BANNERS */}
      {onlineStatus === "Online — insurance discount only" && (
        <section className="py-6 bg-amber-50 border-b border-amber-200">
          <div className="max-w-5xl mx-auto px-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-800">Insurance discount only</p>
              <p className="text-sm text-amber-700">
                Traffic school in {stateMeta.name} is for an insurance discount, not ticket dismissal.
                {stateMeta.code === "MN" && (
                  <> In Minnesota the mandated discount is for drivers age 55 and older who complete an
                    approved accident-prevention course (Minn. Stat. § 65B.28).</>
                )}
                {" "}Confirm the discount with your insurer before enrolling.
              </p>
            </div>
          </div>
        </section>
      )}

      {onlineStatus === "In-person only" && (
        <section className="py-12 bg-white">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Online traffic school isn&apos;t available in {stateMeta.name}
            </h2>
            <p className="text-slate-600 mb-6">
              You&apos;ll need to attend an approved in-person course.
              Contact the court listed on your citation for approved providers.
            </p>
            {stateInfo?.dmvUrl && (
              <a
                href={stateInfo.dmvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-light transition-colors"
              >
                Visit {stateMeta.name} DMV <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </section>
      )}

      {onlineStatus === "Unknown" && (
        <section className="py-8 bg-slate-50 border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-slate-700">Status not confirmed</p>
              <p className="text-sm text-slate-600">
                We&apos;re still researching {stateMeta.name}&apos;s online traffic school rules.
                Contact the court on your citation for current eligibility.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* COURT-DISCRETION states (no statewide program; courses may be accepted
          court by court). The comparison grid still renders below — an approved
          course can count toward a diversion where the court allows it. */}
      {onlineStatus === "Online — court discretion" && (
        <section className="py-6 bg-slate-50 border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-slate-700">Decided court by court</p>
              <p className="text-sm text-slate-600">
                {stateMeta.name} has no statewide traffic-school program. Whether a
                course helps with your ticket is decided by the court on your citation.
                An approved online course can count toward a diversion or dismissal
                agreement where the court accepts it, so confirm with that court before
                you enroll.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* POINT-REDUCTION states: a real online course reduces/credits points but does
          NOT dismiss the ticket. Cards render; the benefit is a point credit, not a
          dismissal. Per-school benefit eligibility is refined by Qualifies-For-Benefit. */}
      {onlineStatus === "Online — point reduction" && (
        <section className="py-6 bg-slate-50 border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-slate-700">Reduces points, not a dismissal</p>
              <p className="text-sm text-slate-600">
                In {stateMeta.name}, completing an approved course reduces or credits
                points on your driving record. It does not dismiss the ticket, and the
                conviction still stands. Confirm the course you pick is state-approved
                for the point credit before you enroll.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* COURT-PROGRAM-ONLY states (no self-serve online course resolves a ticket;
          relief runs through a court program — IL supervision, KY State Traffic
          School). No comparison grid: the national online courses don't satisfy it. */}
      {onlineStatus === "Court program only" && (
        <section className="py-8 bg-slate-50 border-b border-slate-200">
          <div className="max-w-3xl mx-auto px-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-slate-700">
                Handled through an official program, not a retail online course
              </p>
              <p className="text-sm text-slate-600">
                There is no self-serve online course that resolves a {stateMeta.name}{" "}
                ticket on its own. Any required course runs through an official program,
                set by the court on your citation or your state licensing agency, so
                contact them about your options before paying for any course.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* NO-PARTNER-OFFER states (real program, but we list no offer) — suppress the
          comparison grid and point drivers at the official approved-school list and
          the directory below (e.g. Arizona DDS). */}
      {noPartnerOffer && (
        <section className="py-8 bg-slate-50 border-b border-slate-200">
          <div className="max-w-3xl mx-auto px-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-slate-700">
                Choose from the official approved-school list
              </p>
              <p className="text-sm text-slate-600">
                We don&apos;t list a partner offer for {stateMeta.name}. Pick an approved
                course from the state&apos;s official list
                {stateInfo?.dmvUrl && (
                  <>
                    {" "}(
                    <a
                      href={stateInfo.dmvUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent underline"
                    >
                      {stateMeta.name} approved schools
                    </a>
                    )
                  </>
                )}{" "}
                or the directory below, and confirm eligibility with the court on your
                citation before you enroll.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* GEORGIA-SPECIFIC CALLOUT */}
      {stateSlug === "georgia" && (
        <section className="py-6 bg-amber-50 border-b border-amber-200">
          <div className="max-w-5xl mx-auto px-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-800 mb-1">
                Important: Georgia online courses are for ticket dismissal only
              </p>
              <p className="text-sm text-amber-700">
                Georgia&apos;s DDS point reduction program requires a 6-hour course
                completed in a classroom or via Zoom. Online-only courses are not
                accepted for that benefit. The schools listed below are accepted by
                many Georgia courts for ticket dismissal. Check with your court
                before enrolling.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* WASHINGTON DC — the answer is the DC DMV's two approved online providers.
          The national comparison cards below are demoted to reference only: they
          carry no DC benefit claim and their Product/Offer markup is suppressed
          (P10 Task 4). Provider list + process sourced to dmv.dc.gov. */}
      {stateSlug === "washington-dc" && (
        <section className="py-6 bg-amber-50 border-b border-amber-200">
          <div className="max-w-5xl mx-auto px-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-800 mb-1">
                DC point removal runs only through the DC DMV&apos;s two approved providers
              </p>
              <p className="text-sm text-amber-700">
                To remove points in Washington DC you first need approval from a DC DMV
                hearing examiner, then complete a DC DMV-approved online course within 30
                days. The DC DMV lists only two approved online providers:{" "}
                <strong>American Safety Council</strong> and{" "}
                <strong>Online Traffic School Inc.</strong> (
                <a
                  href="https://dmv.dc.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline"
                >
                  dmv.dc.gov
                </a>
                ). The national courses listed below are shown for reference only and are
                <strong> not valid for DC point removal</strong>; confirm the current
                approved-provider list with the DC DMV before you pay.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* STATE VIDEO EXPLAINER — its own section + H2 is the "watch page" the
          VideoObject schema below points at (fixes the Search Console "Video
          isn't on a watch page" flag). */}
      {video && (
        <section className="py-10 bg-white">
          {videoSchema && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }}
            />
          )}
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              {stateMeta.name} Traffic School Video Guide
            </h2>
            <div className="relative w-full overflow-hidden rounded-xl shadow-md" style={{ paddingBottom: "56.25%" }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${video.id}?modestbranding=1&rel=0&origin=https://www.trafficschoolpicker.com`}
                title={`${stateMeta.name} traffic school explainer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      )}

      {/* Product/Offer/AggregateRating/ItemList JSON-LD for the comparison grid —
          server-rendered into the initial HTML, gated on the same condition as the
          cards so prices/ratings in the markup always match what's visible. The
          existing FAQPage schema (FaqSection) is separate and untouched. */}
      {comparisonSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(comparisonSchema) }}
        />
      )}

      {/* TIER 1 COMPARISON CARDS — only for online states */}
      {showComparison && (
        <section className="py-12 bg-white">
          <div className="max-w-5xl mx-auto px-4">
            {/* FTC affiliate disclosure — visible, ABOVE the first monetized CTA in
                DOM order (P12). The long-form disclosure stays below the stack. */}
            <p className="mb-4 text-xs text-slate-500">
              We may earn a commission if you enroll through our links. It never changes a
              school&apos;s score or rank.
            </p>
            <div className="space-y-4">
              {tier1Resolved.map(({ school, resolved }, i) => (
                <SchoolCard
                  key={school.id}
                  school={school}
                  resolved={resolved}
                  rank={i + 1}
                  showProsAndCons
                  stateCode={stateMeta.code}
                  courseHours={stateInfo?.courseHours ?? null}
                  badges={badgesFor(school.id)}
                />
              ))}
            </div>
            <p className="mt-6 text-xs text-slate-500 leading-relaxed">
              We independently research and review all schools. Prices are checked
              periodically and may change or differ at checkout, so confirm the
              current price on the school&apos;s site. We may earn a commission if you
              enroll via our links, at no extra cost to you.
            </p>
          </div>
        </section>
      )}

      {/* STATE INFO */}
      {stateInfo && (
        <section className="py-12 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              {stateMeta.name} Traffic School Rules &amp; Requirements
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-50 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold text-slate-900">Online Status</h3>
                </div>
                {/* P9 B1: the onlineStatus enum keeps its em dash for internal
                    matching; the display swaps it for a comma so no em dash renders. */}
                <p className="text-sm text-slate-600">{stateInfo.onlineStatus.replace(" — ", ", ")}</p>
                {stateInfo.courseHours && (
                  <p className="text-sm text-slate-500 mt-1">
                    Course length: {stateInfo.courseHours}
                  </p>
                )}
              </div>
              {stateInfo.eligibility && (
                <div className="bg-slate-50 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-highlight" />
                    <h3 className="font-semibold text-slate-900">Eligibility</h3>
                  </div>
                  <p className="text-sm text-slate-600">{stateInfo.eligibility}</p>
                </div>
              )}
              {stateInfo.courtNotes && (
                <div className="bg-slate-50 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-slate-900">Court Acceptance</h3>
                  </div>
                  <p className="text-sm text-slate-600">{stateInfo.courtNotes}</p>
                </div>
              )}
              {stateInfo.certificateSubmission && (
                <div className="bg-slate-50 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold text-slate-900">Certificate Submission</h3>
                  </div>
                  <p className="text-sm text-slate-600">{stateInfo.certificateSubmission}</p>
                </div>
              )}
              {stateInfo.dmvUrl && (
                <div className="bg-slate-50 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold text-slate-900">Official DMV</h3>
                  </div>
                  <a
                    href={stateInfo.dmvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-accent underline flex items-center gap-1"
                  >
                    {stateMeta.name} DMV <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {stateInfo.notes && (
                <div className="bg-slate-50 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-5 h-5 text-slate-500" />
                    <h3 className="font-semibold text-slate-900">Notes</h3>
                  </div>
                  <p className="text-sm text-slate-600">{stateInfo.notes}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4">
          <FaqSection faqs={faqs} stateDisplayName={stateMeta.name} />
        </div>
      </section>

      {/* COMMON QUESTIONS — links to this state's Complete question pages
          (/{state}/{question}). Renders nothing when the state has none. */}
      <StateQuestions questions={stateQuestions} stateName={stateMeta.name} />

      {/* RELATED BLOG GUIDES — state → blog half of the bidirectional linking,
          surfacing the most relevant posts so the blog hub gains inlinks. */}
      <RelatedPosts stateCode={stateMeta.code} />

      {/* NEARBY STATES — geographic cross-links (gated on getLinkableStates)
          that push crawl equity from this page to neighboring state pages. */}
      <NearbyStates stateCode={stateMeta.code} linkable={linkableStates} />

      {/* DIRECTORY TABLE — render section on every state page so the layout is
          consistent across states. Shows a placeholder if no rows exist yet. */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          {directory.length > 0 ? (
            <DirectoryTable
              schools={directory}
              stateName={stateMeta.name}
              lastScraped={directory[0]?.lastScraped ?? null}
            />
          ) : (
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                DMV-licensed online traffic schools in {stateMeta.name}
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                Directory data coming soon. We&apos;re collecting the official
                {" "}{stateMeta.name} DMV listing.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
