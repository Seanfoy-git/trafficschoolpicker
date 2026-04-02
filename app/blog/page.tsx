import { Metadata } from "next";
import { blogPosts } from "@/lib/blog";
import Link from "next/link";
import { Calendar, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog — Traffic School Tips & Guides",
  description:
    "Expert guides on online traffic school, ticket dismissal, and keeping your driving record clean. Updated for 2025.",
  alternates: { canonical: "https://trafficschoolpicker.com/blog" },
};

export default function BlogIndex() {
  return (
    <section className="py-12 md:py-16">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
          Traffic School Blog
        </h1>
        <p className="text-lg text-slate-600 mb-10">
          Expert guides, tips, and insights to help you navigate traffic school
          and keep your driving record clean.
        </p>

        <div className="space-y-8">
          {blogPosts.map((post) => (
            <article
              key={post.slug}
              className="border-b border-slate-200 pb-8"
            >
              <Link href={`/blog/${post.slug}`}>
                <h2 className="text-xl font-bold text-slate-900 hover:text-accent transition-colors mb-2">
                  {post.title}
                </h2>
              </Link>
              <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {post.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {post.readTime}
                </span>
              </div>
              <p className="text-slate-600">{post.excerpt}</p>
              <Link
                href={`/blog/${post.slug}`}
                className="inline-block mt-3 text-accent font-semibold text-sm hover:underline"
              >
                Read more &rarr;
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
