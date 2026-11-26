import { ticketCostFor, formatCost, savingsSentence, TICKET_COST_STUDY } from "@/lib/ticket-cost-study";

/**
 * Canonical ticket-cost snapshot for the cost / worth-it question pages. Reads the
 * per-state figures straight from lib/ticket-cost-study.ts so the cost page, the
 * worth-it page, the parent state page, and llms can never show different numbers.
 * Every jurisdiction has a figure since the 26 Nov 2026 re-base; the null check
 * stays so a state missing from the data renders nothing rather than an invented one.
 */
export function TicketCostSnapshot({ stateCode, stateName }: { stateCode: string; stateName: string }) {
  const c = ticketCostFor(stateCode);
  if (!c || c.allInCost == null || c.fine == null || c.threeYearSurcharge == null) return null;
  const rows: [string, string][] = [
    ["Typical fine", formatCost(c.fine)],
    ["Higher insurance, 3 years (est.)", formatCost(c.threeYearSurcharge)],
    ["Total if you just pay it", formatCost(c.allInCost)],
  ];
  return (
    <section className="max-w-3xl mx-auto px-4 pt-6">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-accent mb-3">
          {stateName} ticket cost (2026 study)
        </p>
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {rows.map(([label, val]) => (
            <div key={label}>
              <dt className="text-xs text-slate-500">{label}</dt>
              <dd className="text-xl font-bold text-slate-900 tabular-nums">{val}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-slate-500">
          A typical first ticket for 15 mph over, paid without taking a course.
          {savingsSentence(c) ? <> {savingsSentence(c)}</> : null}{" "}
          <a href={`/blog/${TICKET_COST_STUDY.slug}`} className="text-accent underline">
            See the full study.
          </a>
        </p>
      </div>
    </section>
  );
}
