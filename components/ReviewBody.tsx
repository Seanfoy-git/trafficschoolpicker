import { Fragment, type ReactNode } from "react";
import type { ReviewBlock, ReviewRichText } from "@/lib/types";

/** Render one block's rich-text runs, honoring bold, italic, and links. Marks
 *  compose (a run can be bold + italic + a link). */
function RichText({ runs }: { runs: ReviewRichText[] }) {
  return (
    <>
      {runs.map((run, i) => {
        let node: ReactNode = run.text;
        if (run.bold) node = <strong>{node}</strong>;
        if (run.italic) node = <em>{node}</em>;
        if (run.href) {
          const external = /^https?:\/\//.test(run.href);
          node = (
            <a
              href={run.href}
              className="text-accent hover:underline"
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {node}
            </a>
          );
        }
        return <Fragment key={i}>{node}</Fragment>;
      })}
    </>
  );
}

/**
 * Renders a school's long-form review body (fetched from its Notion page blocks)
 * as prose: paragraphs as <p>, headings as <h3>, and runs of consecutive list
 * items grouped into a single <ul>/<ol>. Server-rendered — the review text lands
 * in the initial HTML for SEO/LLM extraction. Styling matches the site's other
 * review sections (slate text, relaxed leading).
 */
export function ReviewBody({ blocks }: { blocks: ReviewBlock[] }) {
  const out: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < blocks.length) {
    const { type } = blocks[i];

    if (type === "bulleted_list_item" || type === "numbered_list_item") {
      // Notion emits list items as a flat sequence — group consecutive ones of
      // the same kind into a single list element.
      const items: ReviewBlock[] = [];
      while (i < blocks.length && blocks[i].type === type) {
        items.push(blocks[i]);
        i++;
      }
      const lis = items.map((it, j) => (
        <li key={j}>
          <RichText runs={it.richText} />
        </li>
      ));
      out.push(
        type === "bulleted_list_item" ? (
          <ul key={key++} className="list-disc pl-6 space-y-2 text-slate-700 leading-relaxed">
            {lis}
          </ul>
        ) : (
          <ol key={key++} className="list-decimal pl-6 space-y-2 text-slate-700 leading-relaxed">
            {lis}
          </ol>
        )
      );
      continue;
    }

    if (type === "heading_2" || type === "heading_3") {
      out.push(
        <h3 key={key++} className="text-lg font-semibold text-slate-900 mt-6 mb-2">
          <RichText runs={blocks[i].richText} />
        </h3>
      );
      i++;
      continue;
    }

    // paragraph
    out.push(
      <p key={key++} className="text-slate-700 leading-relaxed">
        <RichText runs={blocks[i].richText} />
      </p>
    );
    i++;
  }

  return <div className="space-y-4">{out}</div>;
}
