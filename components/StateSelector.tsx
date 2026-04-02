"use client";

import { useRouter } from "next/navigation";
import { STATE_LIST } from "@/lib/state-utils";
import { MapPin } from "lucide-react";

export function StateSelector({ size = "lg" }: { size?: "sm" | "lg" }) {
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const slug = e.target.value;
    if (slug) router.push(`/${slug}`);
  };

  const sizeClasses =
    size === "lg" ? "px-6 py-4 text-lg pr-12" : "px-4 py-2 text-sm pr-10";

  return (
    <div className="relative inline-block">
      <MapPin
        className={`absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 ${
          size === "lg" ? "w-5 h-5" : "w-4 h-4"
        }`}
      />
      <select
        onChange={handleChange}
        defaultValue=""
        className={`${sizeClasses} pl-10 rounded-lg border border-slate-300 bg-white text-slate-800 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent`}
      >
        <option value="" disabled>
          Select your state...
        </option>
        {STATE_LIST.map((state) => (
          <option key={state.slug} value={state.slug}>
            {state.name}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
