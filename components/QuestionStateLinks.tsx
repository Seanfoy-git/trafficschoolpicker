import Link from "next/link";
import type { QuestionPage } from "@/lib/types";
import { getStateBySlug } from "@/lib/state-utils";

/**
 * On a national hub post, links down to every live state version of that question
 * (/{state}/{question-slug}). `questions` is already filtered to this post's
 * question slug, so it's empty on any other post and the block renders nothing —
 * new state versions appear automatically as their Notion rows go Complete.
 */
export function QuestionStateLinks({ questions }: { questions: QuestionPage[] }) {
  if (questions.length === 0) return null;
  const sorted = [...questions].sort((a, b) => a.stateSlug.localeCompare(b.stateSlug));
  return (
    <section className="mt-12 pt-8 border-t border-slate-200">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Answered for your state</h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {sorted.map((q) => {
          const name = getStateBySlug(q.stateSlug)?.name ?? q.stateCode;
          return (
            <li key={q.stateSlug}>
              <Link
                href={`/${q.stateSlug}/${q.questionSlug}`}
                className="text-accent underline"
              >
                {name}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
