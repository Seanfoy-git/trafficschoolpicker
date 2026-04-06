"use client";

import { useState } from "react";
import type { SchoolWithPrice } from "@/lib/types";
import { MultiRatingCompact } from "./MultiRating";
import { RatingStars } from "./RatingStars";
import { Badge } from "./Badge";
import { AffiliateButton } from "./AffiliateButton";
import { ArrowUpDown, Clock, CheckCircle, Smartphone, Shield } from "lucide-react";
import Link from "next/link";

type SortKey = "price" | "rating" | "completionHours";

export function ComparisonTable({
  schools,
}: {
  schools: SchoolWithPrice[];
}) {
  const [sortBy, setSortBy] = useState<SortKey>("rating");
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = [...schools].sort((a, b) => {
    if (sortBy === "price") {
      if (a.price === null && b.price === null) return 0;
      if (a.price === null) return 1;
      if (b.price === null) return -1;
      return sortAsc ? a.price - b.price : b.price - a.price;
    }
    const aVal = a[sortBy] ?? 0;
    const bVal = b[sortBy] ?? 0;
    return sortAsc ? aVal - bVal : bVal - aVal;
  });

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(key);
      setSortAsc(key === "price" || key === "completionHours");
    }
  };

  const SortHeader = ({ label, sortKey }: { label: string; sortKey: SortKey }) => (
    <button
      onClick={() => handleSort(sortKey)}
      className="flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900"
    >
      {label}
      <ArrowUpDown className={`w-3.5 h-3.5 ${sortBy === sortKey ? "text-accent" : "text-slate-400"}`} />
    </button>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-slate-200 text-left">
            <th className="pb-3 pr-4 font-semibold text-slate-700">School</th>
            <th className="pb-3 px-4">
              <SortHeader label="Price" sortKey="price" />
            </th>
            <th className="pb-3 px-4">
              <SortHeader label="Rating" sortKey="rating" />
            </th>
            <th className="pb-3 px-4">
              <SortHeader label="Time" sortKey="completionHours" />
            </th>
            <th className="pb-3 px-4 font-semibold text-slate-700">Features</th>
            <th className="pb-3 pl-4"></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((school, i) => (
            <tr
              key={school.id}
              className={`border-b border-slate-100 ${i === 0 ? "bg-green-50/50" : ""}`}
            >
              <td className="py-4 pr-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {i + 1}
                  </div>
                  <div>
                    <Link
                      href={`/reviews/${school.slug}`}
                      className="font-semibold text-slate-900 hover:text-accent"
                    >
                      {school.name}
                    </Link>
                    {school.badge && (
                      <div className="mt-1">
                        <Badge type={school.badge} />
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="py-4 px-4">
                {school.price !== null ? (
                  <>
                    <div className="font-bold text-slate-900">
                      ${school.price.toFixed(2)}
                    </div>
                    {school.originalPrice && (
                      <div className="text-xs text-slate-400 line-through">
                        ${school.originalPrice.toFixed(2)}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-slate-500">Check site</div>
                )}
              </td>
              <td className="py-4 px-4">
                {school.ratings.length > 0 || school.bbb ? (
                  <MultiRatingCompact ratings={school.ratings} bbb={school.bbb} />
                ) : school.rating !== null ? (
                  <>
                    <RatingStars rating={school.rating} size="sm" />
                    <div className="text-xs text-slate-500 mt-0.5">
                      {school.reviewCount?.toLocaleString()} {school.reviewSource ?? ""} reviews
                    </div>
                  </>
                ) : null}
              </td>
              <td className="py-4 px-4">
                {school.completionHours && (
                  <span className="flex items-center gap-1 text-slate-700">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {school.completionHours}h
                  </span>
                )}
              </td>
              <td className="py-4 px-4">
                <div className="flex gap-2">
                  {school.courtAcceptance === "All Courts" && (
                    <span title="Accepted by all courts" className="text-green-600">
                      <CheckCircle className="w-4 h-4" />
                    </span>
                  )}
                  {school.mobileApp && (
                    <span title="Mobile app available" className="text-blue-600">
                      <Smartphone className="w-4 h-4" />
                    </span>
                  )}
                  {school.moneyBackGuarantee && (
                    <span title="Money-back guarantee" className="text-amber-600">
                      <Shield className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </td>
              <td className="py-4 pl-4">
                <AffiliateButton
                  school={school}
                  variant={i === 0 ? "primary" : "secondary"}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
