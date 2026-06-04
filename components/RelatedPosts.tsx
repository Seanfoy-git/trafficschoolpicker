import Link from "next/link";
import { getPostsForState } from "@/lib/internal-links";
import { BLOG_SEO } from "@/lib/seo-config";
import { ArrowRight } from "lucide-react";

type Props = {
  /** Current state's two-letter code. */
  stateCode: string;
  max?: number;
};

// State-page → blog cross-link module (the state side of the bidirectional
// blog ↔ state linking). Surfaces the most relevant guides for this state so
// the blog hub's posts gain inlinks from indexed state pages.
export function RelatedPosts({ stateCode, max = 3 }: Props) {
  const posts = getPostsForState(stateCode, max)
    .map((slug) => ({ slug, seo: BLOG_SEO[slug] }))
    .filter((p): p is { slug: string; seo: (typeof BLOG_SEO)[string] } => Boolean(p.seo));

  if (posts.length === 0) return null;

  return (
    <section className="py-12 bg-white border-t border-slate-100">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">
          Traffic ticket guides &amp; tips
        </h2>
        <ul className="space-y-3">
          {posts.map(({ slug, seo }) => (
            <li key={slug}>
              <Link
                href={`/blog/${slug}`}
                className="group inline-flex items-start gap-2 text-accent font-medium hover:underline"
              >
                <ArrowRight className="w-4 h-4 mt-1 shrink-0" />
                <span>{seo.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
