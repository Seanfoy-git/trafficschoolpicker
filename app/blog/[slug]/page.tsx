import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { BLOG_SEO } from "@/lib/seo-config";
import { BlogMdxComponents } from "@/components/BlogMdxComponents";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const seo = BLOG_SEO[slug];
  const post = getPostBySlug(slug);
  if (!post) return {};

  const title = seo?.title ?? post.title;
  const description = seo?.description ?? post.description;
  const canonical = `https://www.trafficschoolpicker.com${seo?.canonicalPath ?? `/blog/${slug}`}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "TrafficSchoolPicker",
      type: "article",
      publishedTime: post.publishedAt,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post || !post.published) notFound();

  const seo = BLOG_SEO[slug];

  // Dynamically import the MDX file
  let PostContent;
  try {
    const mod = await import(`@/content/blog/${slug}.mdx`);
    PostContent = mod.default;
  } catch {
    notFound();
  }

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    publisher: {
      "@type": "Organization",
      name: "TrafficSchoolPicker",
      url: "https://www.trafficschoolpicker.com",
    },
  };

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-3xl mx-auto px-4">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />

        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-sm text-accent hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to blog
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          {seo?.h1 ?? post.title}
        </h1>

        <div className="flex items-center gap-4 text-sm text-slate-500 mb-8 pb-8 border-b border-slate-200">
          <time dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </div>

        <article className="prose prose-slate prose-lg max-w-none prose-headings:text-slate-900 prose-a:text-accent prose-a:no-underline hover:prose-a:underline">
          <PostContent components={BlogMdxComponents} />
        </article>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-500">
            Last updated:{" "}
            {new Date(post.updatedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>
    </section>
  );
}
