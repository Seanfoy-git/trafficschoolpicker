"use client";

import { useState } from "react";
import { Search, ExternalLink, Phone } from "lucide-react";
import type { DirectorySchool } from "@/lib/types";

export function DirectoryTable({
  schools,
  stateName,
  lastScraped,
}: {
  schools: DirectorySchool[];
  stateName: string;
  lastScraped: string | null;
}) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? schools.filter((s) => {
        const q = query.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.licenseNumber.toLowerCase().includes(q) ||
          s.phone.toLowerCase().includes(q) ||
          (s.website ?? "").toLowerCase().includes(q)
        );
      })
    : schools;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            All {schools.length} DMV-licensed online traffic schools in{" "}
            {stateName}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Source: Official {stateName} DMV records &middot; Last verified{" "}
            {lastScraped ?? "April 2026"}
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search schools..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200 text-left">
              <th className="pb-3 pr-4 font-semibold text-slate-700">Name</th>
              <th className="pb-3 px-4 font-semibold text-slate-700">
                License #
              </th>
              <th className="pb-3 px-4 font-semibold text-slate-700">Phone</th>
              <th className="pb-3 pl-4 font-semibold text-slate-700">
                Website
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((school) => (
              <tr
                key={school.id}
                className="border-b border-slate-100 hover:bg-slate-50"
              >
                <td className="py-3 pr-4 font-medium text-slate-900">
                  {school.name}
                </td>
                <td className="py-3 px-4 text-slate-600 font-mono text-xs">
                  {school.licenseNumber}
                </td>
                <td className="py-3 px-4">
                  {school.phone ? (
                    <a
                      href={`tel:${school.phone}`}
                      className="flex items-center gap-1 text-slate-600 hover:text-accent"
                    >
                      <Phone className="w-3 h-3" />
                      {school.phone}
                    </a>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="py-3 pl-4">
                  {school.website ? (
                    <a
                      href={school.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-accent hover:underline"
                    >
                      Visit <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">
                  No schools match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-slate-400">
        This directory lists all DMV-licensed online schools in {stateName}.
        Schools above have been independently reviewed. Directory listings have
        not.
      </p>
    </div>
  );
}
