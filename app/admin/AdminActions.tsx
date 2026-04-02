"use client";

import { useState } from "react";
import { RefreshCw, ExternalLink } from "lucide-react";

export function AdminActions() {
  const [deploying, setDeploying] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null
  );

  const triggerDeploy = async () => {
    setDeploying(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/deploy", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setResult({ ok: true, message: "Deploy triggered successfully." });
      } else {
        setResult({ ok: false, message: data.error ?? "Deploy failed." });
      }
    } catch {
      setResult({ ok: false, message: "Network error." });
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <button
        onClick={triggerDeploy}
        disabled={deploying}
        className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-white font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 ${deploying ? "animate-spin" : ""}`} />
        {deploying ? "Deploying..." : "Trigger Redeploy"}
      </button>

      <a
        href="https://www.notion.so"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-5 py-2.5 rounded-lg border border-slate-300 transition-colors"
      >
        Open Notion <ExternalLink className="w-4 h-4" />
      </a>

      {result && (
        <span
          className={`self-center text-sm ${
            result.ok ? "text-green-600" : "text-red-600"
          }`}
        >
          {result.message}
        </span>
      )}
    </div>
  );
}
