import { ticketCostFor, formatCost, TICKET_COST_STUDY } from "@/lib/ticket-cost-study";

/**
 * Canonical ticket-cost snapshot for the cost / worth-it question pages. Reads the
 * per-state figures straight from lib/ticket-cost-study.ts so the cost page, the
 * worth-it page, the parent state page, and llms can never show different numbers.
 * Renders nothing for states the study publishes no figure for (e.g. GA, whose
 * benefit is a point reduction, not a ticket-cost trade) — we never invent one.
 */
export function TicketCostSnapshot({ stateCode, stateName }: { stateCode: string; stateName: string }) {
  const c = ticketCostFor(stateCode);
  if (!c || c.allInCost == null || c.fine == null || c.threeYearSurcharge == null) return null;
  const rows: [string, string][] = [
    ["Typical fine", formatCost(c.fine)],
    ["3-year insurance exposure", formatCost(c.threeYearSurcharge)],
    ["All-in cost", formatCost(c.allInCost)],
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
          A typical first-offense 10-over ticket: fine plus estimated three-year insurance
          surcharge.{" "}
          <a href={`/blog/${TICKET_COST_STUDY.slug}`} className="text-accent hover:underline">
            See the full study.
          </a>
        </p>
      </div>
    </section>
  );
}
