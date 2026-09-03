import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  images: {
    // Governs how long the optimizer caches a transcoded variant before re-encoding
    // (edge compute saving). Note: on Vercel the CLIENT-facing max-age on /_next/image
    // stays 0 regardless — the durable client cache is set on the static originals via
    // headers() below, which is what Googlebot Image (16% of crawl) actually re-fetches.
    minimumCacheTTL: 31536000,
  },
  async headers() {
    return [
      {
        // Immutable static art: state flags and the OG cards (public/flags, public/images).
        // These never change at a given path, but Vercel's default serves them with
        // `max-age=0, must-revalidate`, so Googlebot Image re-fetches every visit (the OG
        // cards are 40-67KB each). A one-year immutable cache stops those re-fetches.
        source: "/:dir(flags|images)/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

// Plugins MUST be specified as string names (not imported functions): Next's
// Turbopack MDX loader serializes this config to Rust and can't pass JS functions.
// - remark-frontmatter: recognizes the `---` YAML block so it is NOT rendered as
//   body content (without it, the frontmatter compiled to a stray heading — the
//   "weird HTML" atop every post). gray-matter still reads it for metadata.
// - remark-gfm: turns markdown pipe tables (and strikethrough) into real elements;
//   without it, blog tables rendered as raw "| ... |" text.
// - rehype-slug: adds ids to headings for in-page anchor links (invisible).
//   (rehype-autolink-headings is intentionally NOT wired: the blog's custom <a>
//   component forces target="_blank", which turned heading anchors into new-tab
//   links to a #hash — worse than no anchor.)
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-frontmatter", "remark-gfm"],
    rehypePlugins: ["rehype-slug"],
  },
});

export default withMDX(nextConfig);
