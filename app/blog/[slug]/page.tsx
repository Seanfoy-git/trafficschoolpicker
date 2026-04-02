import { Metadata } from "next";
import { notFound } from "next/navigation";
import { blogPosts, getBlogPostBySlug } from "@/lib/blog";
import Link from "next/link";
import { Calendar, Clock, ArrowLeft } from "lucide-react";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: `https://trafficschoolpicker.com/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    datePublished: post.date,
    author: {
      "@type": "Organization",
      name: "TrafficSchoolPicker",
    },
    publisher: {
      "@type": "Organization",
      name: "TrafficSchoolPicker",
    },
  };

  // Simple markdown-to-HTML for ## headings and **bold**
  const contentHtml = post.content
    .split("\n")
    .map((line) => {
      if (line.startsWith("## ")) {
        return `<h2 class="text-xl font-bold text-slate-900 mt-8 mb-3">${line.slice(3)}</h2>`;
      }
      if (line.startsWith("### ")) {
        return `<h3 class="text-lg font-bold text-slate-900 mt-6 mb-2">${line.slice(4)}</h3>`;
      }
      if (line.startsWith("- **")) {
        const formatted = line
          .replace(/\*\*(.+?)\*\*/g, '<strong class="text-slate-900">$1</strong>');
        return `<li class="ml-4 text-slate-600">${formatted.slice(2)}</li>`;
      }
      if (line.startsWith("- ")) {
        return `<li class="ml-4 text-slate-600">${line.slice(2)}</li>`;
      }
      if (line.trim() === "") return "<br />";
      const formatted = line.replace(
        /\*\*(.+?)\*\*/g,
        '<strong class="text-slate-900">$1</strong>'
      );
      return `<p class="text-slate-600 leading-relaxed">${formatted}</p>`;
    })
    .join("\n");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm text-accent hover:underline mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to blog
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            {post.title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-slate-500 mb-8 pb-8 border-b border-slate-200">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {post.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {post.readTime}
            </span>
          </div>

          <div
            className="prose-custom space-y-1"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </div>
      </article>
    </>
  );
}
