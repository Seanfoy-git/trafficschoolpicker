import Link from "next/link";
import { HelpCircle } from "lucide-react";
import type { QuestionPage } from "@/lib/types";

/**
 * "Common questions" block on a state page — links to that state's Complete
 * question pages (/{state}/{question-slug}). Renders nothing when the state has
 * no Complete question rows, so it appears automatically as rows go Complete with
 * no per-state code change.
 */
export function StateQuestions({
  questions,
  stateName,
}: {
  questions: QuestionPage[];
  stateName: string;
}) {
  if (questions.length === 0) return null;
  return (
    <section className="py-8 border-t border-slate-100">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 mb-4">
          <HelpCircle className="w-5 h-5 text-accent shrink-0" />
          Common {stateName} traffic school questions
        </h2>
        <ul className="space-y-2">
          {questions.map((q) => (
            <li key={q.questionSlug}>
              <Link
                href={`/${q.stateSlug}/${q.questionSlug}`}
                className="text-accent underline font-medium"
              >
                {q.h1}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
