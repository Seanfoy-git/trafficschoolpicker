import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getQuestionPages, getQuestionPage, getQuestionBody, getQuestionsForState } from "@/lib/notion";
import { getStateBySlug } from "@/lib/state-utils";
import { buildArticle, buildBreadcrumbList, buildFaqPage } from "@/lib/structured-data";
import { QuestionArticle } from "@/components/QuestionArticle";
import type { ReviewBlock } from "@/lib/types";

const SITE = "https://www.trafficschoolpicker.com";

// Question slug → national hub post. New question templates add a row here.
const HUB_POST: Record<string, string> = {
  "does-traffic-school-remove-points": "/blog/does-traffic-school-remove-points",
};

export const revalidate = 86400;
// Only Complete rows exist as pages; any other /{state}/{question} 404s.
export const dynamicParams = false;

type Props = { params: Promise<{ state: string; question: string }> };

export async function generateStaticParams() {
  const questions = await getQuestionPages();
  return questions.map((q) => ({ state: q.stateSlug, question: q.questionSlug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, question } = await params;
  const q = await getQuestionPage(state, question);
  if (!q) return {};
  const path = `/${q.stateSlug}/${q.questionSlug}`;
  const url = `${SITE}${path}`;
  const ogImage = `${SITE}/images/states/${q.stateSlug}.png`; // reuse the state card for now
  const title = q.titleTag || q.title;
  const description = q.metaDescription;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "TrafficSchoolPicker", type: "article", images: [ogImage] },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
  };
}

/** Extract Q&A pairs from a body that has a genuine Q&A section: each heading_3
 *  ending in "?" is a question, the paragraphs beneath it (until the next heading)
 *  are the answer. Returns [] when there's no such section. */
function extractQA(blocks: ReviewBlock[]): Array<{ question: string; answer: string }> {
  const pairs: Array<{ question: string; answer: string }> = [];
  let q: string | null = null;
  let a: string[] = [];
  const flush = () => { if (q && a.length) pairs.push({ question: q, answer: a.join(" ") }); q = null; a = []; };
  for (const b of blocks) {
    const text = b.richText.map((r) => r.text).join("").trim();
    if (b.type === "heading_3" || b.type === "heading_2") {
      flush();
      if (/\?\s*$/.test(text)) q = text;
    } else if (q && text) {
      a.push(text);
    }
  }
  flush();
  return pairs;
}

export default async function QuestionPage({ params }: Props) {
  const { state, question } = await params;
  const q = await getQuestionPage(state, question);
  if (!q) notFound();

  const stateMeta = getStateBySlug(q.stateSlug);
  const stateName = stateMeta?.name ?? q.stateCode;
  const [body, stateQuestions] = await Promise.all([
    getQuestionBody(q.id),
    getQuestionsForState(q.stateSlug),
  ]);
  // Other Complete question pages for this state → sibling-link gating in the body.
  const siblingSlugs = stateQuestions.map((x) => x.questionSlug).filter((s) => s !== q.questionSlug);

  const path = `/${q.stateSlug}/${q.questionSlug}`;
  const ogImage = `${SITE}/images/states/${q.stateSlug}.png`;
  const hubPath = HUB_POST[q.questionSlug] ?? null;

  // Structured data: Article + BreadcrumbList (+ FAQPage only when a real Q&A exists).
  const breadcrumbSchema = buildBreadcrumbList([
    { name: "Home", path: "/" },
    { name: stateName, path: `/${q.stateSlug}` },
    { name: q.h1, path },
  ]);
  const articleSchema = q.lastVerified
    ? buildArticle({ headline: q.h1, path, dateIso: q.lastVerified, description: q.metaDescription, image: ogImage })
    : null;
  const faqSchema = body.hasQA ? buildFaqPage(extractQA(body.body)) : null;

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {articleSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      )}
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}

      {/* Breadcrumb: Home › State › Question */}
      <nav aria-label="Breadcrumb" className="bg-slate-50 border-b border-slate-100">
        <ol className="max-w-3xl mx-auto px-4 py-3 flex flex-wrap items-center gap-1 text-sm text-slate-500">
          <li><Link href="/" className="hover:text-accent">Home</Link></li>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <li><Link href={`/${q.stateSlug}`} className="hover:text-accent">{stateName}</Link></li>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <li className="text-slate-700 font-medium truncate">{q.h1}</li>
        </ol>
      </nav>

      <header className="max-w-3xl mx-auto px-4 pt-8">
        <h1 className="text-3xl font-bold text-slate-900">{q.h1}</h1>
      </header>

      <QuestionArticle
        keyFacts={body.keyFacts}
        body={body.body}
        sources={body.sources}
        stateName={stateName}
        stateSlug={q.stateSlug}
        lastVerified={q.lastVerified}
        hubPath={hubPath}
        siblingSlugs={siblingSlugs}
      />
    </main>
  );
}
