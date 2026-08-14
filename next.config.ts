import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
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
