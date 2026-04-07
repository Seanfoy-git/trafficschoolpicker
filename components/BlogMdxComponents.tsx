import Link from "next/link";
import type { MDXComponents } from "mdx/types";

function QuickAnswer({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="bg-accent/5 border-l-4 border-accent rounded-r-lg p-5 mb-8 not-prose"
      role="note"
      aria-label="Quick Answer"
    >
      <p className="text-xs font-bold uppercase tracking-widest text-accent mb-2">
        Quick Answer
      </p>
      <div className="text-slate-800 font-medium leading-relaxed">
        {children}
      </div>
    </div>
  );
}

export const BlogMdxComponents: MDXComponents = {
  QuickAnswer,

  a: ({ href, children }) => {
    const isInternal = href?.startsWith("/");
    if (isInternal) {
      return (
        <Link
          href={href!}
          className="text-accent hover:underline font-medium"
        >
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent hover:underline"
      >
        {children}
      </a>
    );
  },

  table: ({ children }) => (
    <div className="overflow-x-auto my-6 not-prose">
      <table className="min-w-full border border-slate-200 text-sm">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className="bg-slate-50 px-4 py-3 text-left font-semibold border-b border-slate-200 text-slate-700">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 border-b border-slate-100 text-slate-600">
      {children}
    </td>
  ),

  h2: ({ children }) => (
    <h2 className="text-xl font-bold mt-10 mb-4 text-slate-900">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-semibold mt-8 mb-3 text-slate-900">
      {children}
    </h3>
  ),
};
