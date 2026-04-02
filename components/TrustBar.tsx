import { ShieldCheck, Users, RefreshCw } from "lucide-react";

export function TrustBar() {
  return (
    <div className="bg-slate-50 border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-slate-600">
        <span className="flex items-center gap-1.5">
          <Users className="w-4 h-4 text-accent" />
          Trusted by 500,000+ drivers
        </span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-accent" />
          All schools court-approved
        </span>
        <span className="flex items-center gap-1.5">
          <RefreshCw className="w-4 h-4 text-accent" />
          Updated April 2025
        </span>
      </div>
    </div>
  );
}
