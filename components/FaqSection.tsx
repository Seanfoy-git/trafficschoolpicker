import type { StateFaq } from "@/lib/notion-faqs";

type Props = {
  faqs: StateFaq[];
  stateDisplayName: string;
};

export function FaqSection({ faqs, stateDisplayName }: Props) {
  if (faqs.length === 0) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <h2 className="text-2xl font-bold text-slate-900 mb-6">
        {stateDisplayName} Traffic School FAQ
      </h2>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <details
            key={index}
            className="border border-slate-200 rounded-lg group"
          >
            <summary className="flex justify-between items-center px-5 py-4 cursor-pointer font-medium text-slate-900 hover:bg-slate-50 transition-colors list-none">
              {faq.question}
              <span className="ml-4 shrink-0 text-slate-400 group-open:rotate-180 transition-transform">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </span>
            </summary>
            <p className="px-5 pb-4 text-slate-600 leading-relaxed">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </>
  );
}
