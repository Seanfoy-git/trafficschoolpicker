import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import { Calendar } from "lucide-react";

export const metadata: Metadata = {
  title: "Traffic School Blog — Guides & Tips",
  description:
    "Expert guides on traffic ticket dismissal, defensive driving, and how to choose the right online traffic school in your state.",
  alternates: {
    canonical: "https://www.trafficschoolpicker.com/blog",
  },
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          Traffic School Blog
        </h1>
        <p className="text-lg text-slate-600 mb-10">
          Expert guides on dismissing traffic tickets, understanding state
          rules, and choosing the best online traffic school.
        </p>

        <div className="space-y-8">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="border-b border-slate-200 pb-8"
            >
              <Link href={`/blog/${post.slug}`}>
                <h2 className="text-xl font-bold text-slate-900 hover:text-accent transition-colors mb-2">
                  {post.title}
                </h2>
              </Link>
              <p className="text-slate-600 text-sm mb-3">
                {post.description}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
