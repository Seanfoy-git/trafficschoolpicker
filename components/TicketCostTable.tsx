import Link from "next/link";
import { STATE_LIST } from "@/lib/state-utils";
import {
  STATE_TICKET_COST,
  MOST_EXPENSIVE,
  CHEAPEST,
  BEST_SAVINGS,
  formatCost,
} from "@/lib/ticket-cost-study";

const byCode = (code: string) => STATE_LIST.find((s) => s.code === code);

/**
 * Renders one of the three canonical ticket-cost study tables directly from
 * lib/ticket-cost-study.ts, so the blog, state pages, and llms never drift.
 * Used inside the true-cost MDX via the blog component registry.
 */
export function TicketCostTable({
  variant,
}: {
  variant: "most" | "cheapest" | "savings";
}) {
  const codes =
    variant === "most" ? MOST_EXPENSIVE : variant === "cheapest" ? CHEAPEST : BEST_SAVINGS;
  const isSavings = variant === "savings";
  const th =
    "bg-slate-50 px-4 py-3 text-left font-semibold border-b border-slate-200 text-slate-700";
  const td = "px-4 py-3 border-b border-slate-100 text-slate-700";

  return (
    <div className="overflow-x-auto my-6 not-prose">
      <table className="min-w-full border border-slate-200 text-sm">
        <thead>
          <tr>
            <th className={th}>#</th>
            <th className={th}>State</th>
            <th className={th}>
              {isSavings ? "Net savings from traffic school" : "All-in cost"}
            </th>
          </tr>
        </thead>
        <tbody>
          {codes.map((code, i) => {
            const meta = byCode(code);
            const d = STATE_TICKET_COST[code];
            const value = isSavings
              ? `~${formatCost(d.netSavings ?? 0)}`
              : formatCost(d.allInCost ?? 0);
            return (
              <tr key={code}>
                <td className={td}>{i + 1}</td>
                <td className={td}>
                  {meta ? (
                    <Link href={`/${meta.slug}`} className="text-accent hover:underline font-medium">
                      {meta.name}
                    </Link>
                  ) : (
                    code
                  )}
                  {isSavings && d.mechanism ? (
                    <span className="text-slate-500"> ({d.mechanism})</span>
                  ) : null}
                </td>
                <td className={`${td} tabular-nums`}>{value}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
