import Link from "next/link";
import type { Cell, ComparisonRow, StateComparison } from "@/lib/comparison";
import { NOT_STATED, dayLabel } from "@/lib/comparison";

/**
 * P17 comparison table — a real <table> (not cards) listing every compared school
 * with its price and the rule facts, each fact linked to the page it was read from
 * or reading "Not stated". On narrow screens the table scrolls sideways inside a
 * keyboard-focusable region while the School column stays pinned, so it stays a
 * table at 320px instead of collapsing back to cards.
 */

// Government / court / statute hosts are cited as sources; school sites are not
// endorsed, so their links carry nofollow.
function relFor(href: string): string {
  try {
    const h = new URL(href).hostname;
    if (/\.(gov|us)$/.test(h) || /(^|\.)azcourts\.gov$/.test(h)) return "noopener noreferrer";
  } catch {
    /* fall through */
  }
  return "nofollow noopener noreferrer";
}

function FactCell({ c }: { c: Cell }) {
  if (!c.href) return <span className="text-slate-600">{NOT_STATED}</span>;
  return (
    <a href={c.href} target="_blank" rel={relFor(c.href)} className="text-accent underline">
      {c.text}
    </a>
  );
}

function shortDay(iso: string | null): string | null {
  const full = iso ? dayLabel(iso) : null;
  if (!full) return null;
  const [d, m, y] = full.split(" ");
  return `${d} ${m.slice(0, 3)} ${y}`;
}

function PriceCell({ r }: { r: ComparisonRow }) {
  if (r.price === null) {
    return (
      <a href={r.sourceUrl} target="_blank" rel={relFor(r.sourceUrl)} className="text-sm text-slate-700 underline">
        {r.priceText}
      </a>
    );
  }
  return (
    <span className="font-bold text-slate-900 tabular-nums">
      {r.priceText}
      {r.priceIncludesFees && (
        <sup>
          <a href="#compare-fees" className="text-accent underline" aria-label="All-in price, see note below the table">
            *
          </a>
        </sup>
      )}
    </span>
  );
}

export function StateComparisonTable({
  comparison: c,
  heading,
  stateName,
}: {
  comparison: StateComparison;
  heading: string;
  stateName: string;
}) {
  const th = "px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700 whitespace-nowrap";
  const td = "px-3 py-3 align-top text-sm text-slate-700";
  return (
    <section id="compare" aria-labelledby="compare-heading" className="py-8 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 id="compare-heading" className="text-2xl font-bold text-slate-900 mb-4">
          {heading}
        </h2>
        <div
          className="relative overflow-x-auto rounded-lg border border-slate-200"
          role="region"
          aria-labelledby="compare-heading"
          tabIndex={0}
        >
          <table className="min-w-[56rem] w-full border-collapse">
            <caption className="sr-only">
              Online schools in {stateName} compared on price, course length, timers, final exam, completion
              reporting and TSP Score, with the source each row was verified from.
            </caption>
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th scope="col" className={`${th} sticky left-0 z-10 bg-slate-50`}>School</th>
                <th scope="col" className={th}>Price</th>
                <th scope="col" className={th}>Course length</th>
                <th scope="col" className={th}>Timers</th>
                <th scope="col" className={th}>Final exam</th>
                <th scope="col" className={th}>Completion reporting</th>
                <th scope="col" className={th}>TSP Score</th>
                <th scope="col" className={th}>Source</th>
              </tr>
            </thead>
            <tbody>
              {c.rows.map((r) => (
                <tr
                  key={r.key}
                  className="border-b border-slate-100 last:border-b-0"
                  data-tier={r.tier}
                  data-priced={r.price !== null ? "yes" : "no"}
                  data-price={r.price !== null ? r.price.toFixed(2) : undefined}
                  data-school={r.name}
                >
                  <th scope="row" className={`${td} sticky left-0 z-10 bg-white text-left font-semibold`}>
                    <a href={r.href} target="_blank" rel={r.rel} className="text-slate-900 underline">
                      {r.name}
                    </a>
                  </th>
                  <td className={`${td} whitespace-nowrap`}>
                    <PriceCell r={r} />
                  </td>
                  <td className={td}>
                    <FactCell c={r.courseLength} />
                  </td>
                  <td className={td}>
                    <FactCell c={r.timers} />
                  </td>
                  <td className={td}>
                    <FactCell c={r.finalExam} />
                  </td>
                  <td className={`${td} whitespace-nowrap`}>
                    <FactCell c={r.reporting} />
                  </td>
                  <td className={td}>
                    {r.tspScore != null ? (
                      <Link href="/methodology" className="font-semibold text-accent underline">
                        {r.tspScore.toFixed(1)}
                        <span className="sr-only"> out of 5</span>
                      </Link>
                    ) : (
                      <span className="sr-only">Not reviewed</span>
                    )}
                  </td>
                  <td className={`${td} whitespace-nowrap`}>
                    <a href={r.sourceUrl} target="_blank" rel={relFor(r.sourceUrl)} className="text-accent underline">
                      School page
                    </a>
                    {r.priceChecked && (
                      <span className="block text-xs text-slate-600">checked {shortDay(r.priceChecked)}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {c.anyFeesFolded && (
          <p id="compare-fees" className="mt-3 text-xs text-slate-600">
            * All-in price: the school&apos;s own page states this is the total you pay, with any mandatory
            school fee (certificate, processing or state fee) included. Court fees are separate.
          </p>
        )}
        <p className="mt-3 text-xs text-slate-600">
          Every row is checked against the school&apos;s own site. Rows we have not priced show a direct link.
          {c.verifiedLabel && <> Prices verified {c.verifiedLabel}.</>} Report an error:{" "}
          hello@trafficschoolpicker.com.
        </p>
      </div>
    </section>
  );
}
