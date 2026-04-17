"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { School } from "@/lib/types";
import { STATE_LIST } from "@/lib/state-utils";
import { ArrowUpDown, ExternalLink } from "lucide-react";

type SortKey = "name" | "rating" | "reviewCount" | "price" | "hours";
type SortDir = "asc" | "desc";

export function SchoolsDirectoryTable({ schools }: { schools: School[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("rating");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [stateFilter, setStateFilter] = useState<string>("");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    let list = schools;

    if (stateFilter) {
      list = list.filter(
        (s) => s.stateCodes.includes("all") || s.stateCodes.includes(stateFilter)
      );
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }

    const sorted = [...list].sort((a, b) => {
      const getValue = (s: School): number | string => {
        switch (sortKey) {
          case "name": return s.name.toLowerCase();
          case "rating": return s.rating ?? 0;
          case "reviewCount": return s.reviewCount ?? 0;
          case "price": return s.genericPrice ?? Number.MAX_SAFE_INTEGER;
          case "hours": return s.completionHours ?? Number.MAX_SAFE_INTEGER;
        }
      };
      const av = getValue(a);
      const bv = getValue(b);
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [schools, sortKey, sortDir, stateFilter, query]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  };

  const SortHeader = ({ label, keyName, className = "" }: { label: string; keyName: SortKey; className?: string }) => (
    <th className={`py-3 px-4 text-left font-semibold text-slate-700 ${className}`}>
      <button
        onClick={() => toggleSort(keyName)}
        className="inline-flex items-center gap-1 hover:text-accent transition-colors"
      >
        {label}
        <ArrowUpDown className={`w-3 h-3 ${sortKey === keyName ? "text-accent" : "text-slate-300"}`} />
      </button>
    </th>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="search"
          placeholder="Search by school name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          <option value="">All states</option>
          {STATE_LIST.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <p className="text-sm text-slate-500 mb-3">
        Showing {filtered.length} of {schools.length} schools
        {stateFilter && <> approved in {STATE_LIST.find((s) => s.code === stateFilter)?.name}</>}
      </p>

      <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <SortHeader label="School" keyName="name" />
              <SortHeader label="Rating" keyName="rating" />
              <SortHeader label="Reviews" keyName="reviewCount" />
              <SortHeader label="Price" keyName="price" />
              <SortHeader label="Hours" keyName="hours" />
              <th className="py-3 px-4 text-left font-semibold text-slate-700">States</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((school) => (
              <tr key={school.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4">
                  <Link
                    href={`/reviews/${school.slug}`}
                    className="font-semibold text-slate-900 hover:text-accent"
                  >
                    {school.name}
                  </Link>
                </td>
                <td className="py-3 px-4 text-slate-700">
                  {school.rating !== null ? school.rating.toFixed(1) : "—"}
                </td>
                <td className="py-3 px-4 text-slate-500">
                  {school.reviewCount !== null ? school.reviewCount.toLocaleString() : "—"}
                </td>
                <td className="py-3 px-4 text-slate-700">
                  {school.genericPrice !== null ? `$${school.genericPrice.toFixed(2)}` : "Varies"}
                </td>
                <td className="py-3 px-4 text-slate-500">
                  {school.completionHours ? `${school.completionHours}h` : "—"}
                </td>
                <td className="py-3 px-4 text-slate-500 text-xs">
                  {school.stateCodes.includes("all")
                    ? "All 50"
                    : school.stateCodes.length > 0
                    ? `${school.stateCodes.length}`
                    : "—"}
                </td>
                <td className="py-3 px-4 text-right">
                  <Link
                    href={`/reviews/${school.slug}`}
                    className="inline-flex items-center gap-1 text-accent text-xs font-semibold hover:underline"
                  >
                    Review <ExternalLink className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-500">
            No schools match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
