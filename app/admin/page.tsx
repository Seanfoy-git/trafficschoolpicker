import { getAdminStats } from "@/lib/notion";
import { AdminActions } from "./AdminActions";
import { CheckCircle, XCircle, AlertTriangle, ExternalLink } from "lucide-react";

export const revalidate = 0; // always fresh

export default async function AdminPage() {
  let stats;
  let error: string | null = null;

  try {
    stats = await getAdminStats();
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <section className="py-12">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">System Status</h1>
        <p className="text-sm text-slate-500 mb-8">
          Read-only dashboard. Manage data in Notion.
        </p>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-2 text-red-700 font-semibold mb-1">
              <XCircle className="w-5 h-5" /> Failed to fetch from Notion
            </div>
            <p className="text-sm text-red-600">{error}</p>
            <p className="text-xs text-red-500 mt-2">
              Check that NOTION_TOKEN is set and the integration has access to the
              databases.
            </p>
          </div>
        ) : stats ? (
          <>
            {/* School Counts */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Stat label="Total Schools" value={stats.totalSchools} />
              <Stat label="Tier 1 (Featured)" value={stats.tier1Count} />
              <Stat label="Tier 2 (More)" value={stats.tier2Count} />
              <Stat
                label="Missing Affiliate"
                value={stats.noAffiliateCount}
                warn={stats.noAffiliateCount > 0}
              />
            </div>

            {/* Missing Affiliates */}
            {stats.noAffiliateSchools.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
                <div className="flex items-center gap-2 text-amber-700 font-semibold mb-2">
                  <AlertTriangle className="w-4 h-4" /> Schools without affiliate link
                </div>
                <ul className="text-sm text-amber-800 space-y-1">
                  {stats.noAffiliateSchools.map((name) => (
                    <li key={name}>• {name}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Directory Counts */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <Stat label="CA Directory" value={stats.caDirectoryCount} />
              <Stat label="TX Directory" value={stats.txDirectoryCount} />
              <Stat label="FL Directory" value={stats.flDirectoryCount} />
            </div>

            {/* Latest Verified */}
            {stats.latestVerified && (
              <p className="text-sm text-slate-500 mb-8">
                Latest school verified: {stats.latestVerified}
              </p>
            )}

            {/* Environment Checks */}
            <div className="border border-slate-200 rounded-lg p-4 mb-8">
              <h2 className="font-semibold text-slate-900 mb-3">
                Environment Variables
              </h2>
              <div className="space-y-2">
                <EnvCheck label="NOTION_TOKEN" ok={stats.envChecks.notionToken} />
                <EnvCheck label="NOTION_SCHOOLS_DB" ok={stats.envChecks.schoolsDb} />
                <EnvCheck label="NOTION_DIRECTORY_DB" ok={stats.envChecks.directoryDb} />
                <EnvCheck label="NOTION_STATES_DB" ok={stats.envChecks.statesDb} />
                <EnvCheck label="VERCEL_DEPLOY_HOOK" ok={stats.envChecks.deployHook} />
              </div>
            </div>
          </>
        ) : null}

        {/* Actions */}
        <AdminActions />

        <p className="text-xs text-slate-400 mt-6">
          Changes in Notion appear automatically within 24 hours via ISR. Use
          the button above to force an immediate update.
        </p>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  warn = false,
}: {
  label: string;
  value: number;
  warn?: boolean;
}) {
  return (
    <div className="bg-slate-50 rounded-lg p-4 text-center">
      <div
        className={`text-2xl font-bold ${warn ? "text-amber-600" : "text-slate-900"}`}
      >
        {value}
      </div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}

function EnvCheck({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? (
        <CheckCircle className="w-4 h-4 text-green-500" />
      ) : (
        <XCircle className="w-4 h-4 text-red-500" />
      )}
      <span className={ok ? "text-slate-700" : "text-red-700"}>{label}</span>
      <span className="text-xs text-slate-400">{ok ? "Set" : "Missing"}</span>
    </div>
  );
}
