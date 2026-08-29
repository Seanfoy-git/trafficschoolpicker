import { ShieldCheck, Users, RefreshCw } from "lucide-react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Fallback when no verified date is supplied: the build month, so it can never
// go stale to a hardcoded past date (this is what left the homepage stuck on
// "April 2026"). Evaluated at build/revalidation for these SSG pages.
function currentMonthLabel(): string {
  const now = new Date();
  return `Updated ${MONTHS[now.getUTCMonth()]} ${now.getUTCFullYear()}`;
}

function formatVerifiedLabel(iso: string | null | undefined): string {
  if (!iso) return currentMonthLabel();
  // ISO date strings parse in UTC; we only render month/year so timezone is irrelevant.
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return currentMonthLabel();
  return `Last verified ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function TrustBar({
  lastVerified,
  approvalLabel,
}: { lastVerified?: string | null; approvalLabel?: string | null } = {}) {
  return (
    <div className="bg-slate-50 border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-slate-600">
        <span className="flex items-center gap-1.5">
          <Users className="w-4 h-4 text-accent" />
          Trusted by 500,000+ drivers
        </span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-accent" />
          {approvalLabel || "All 50 states and DC covered"}
        </span>
        <span className="flex items-center gap-1.5">
          <RefreshCw className="w-4 h-4 text-accent" />
          {formatVerifiedLabel(lastVerified)}
        </span>
      </div>
    </div>
  );
}
