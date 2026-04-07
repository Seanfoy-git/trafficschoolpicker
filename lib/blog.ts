import fs from "fs";
import path from "path";
import matter from "gray-matter";

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt: string;
  primaryKeyword: string;
  published: boolean;
};

const BLOG_DIR = path.join(process.cwd(), "content/blog");

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"));

  return files
    .map((filename) => {
      const raw = fs.readFileSync(path.join(BLOG_DIR, filename), "utf-8");
      const { data } = matter(raw);
      return {
        slug: data.slug ?? filename.replace(/\.mdx$/, ""),
        title: data.title ?? "",
        description: data.description ?? "",
        publishedAt: data.publishedAt ?? "",
        updatedAt: data.updatedAt ?? "",
        primaryKeyword: data.primaryKeyword ?? "",
        published: data.published ?? false,
      } as BlogPost;
    })
    .filter((post) => post.published === true)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
}

export function getPostBySlug(slug: string): BlogPost | null {
  try {
    const raw = fs.readFileSync(path.join(BLOG_DIR, `${slug}.mdx`), "utf-8");
    const { data } = matter(raw);
    return {
      slug: data.slug ?? slug,
      title: data.title ?? "",
      description: data.description ?? "",
      publishedAt: data.publishedAt ?? "",
      updatedAt: data.updatedAt ?? "",
      primaryKeyword: data.primaryKeyword ?? "",
      published: data.published ?? false,
    };
  } catch {
    return null;
  }
}
