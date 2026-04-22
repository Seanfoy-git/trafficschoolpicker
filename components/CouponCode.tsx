"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CouponCode({ code, discount }: { code: string; discount?: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore — clipboard may be unavailable
    }
  };

  return (
    <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm">
      <span className="text-amber-900">
        Use code{" "}
        <button
          onClick={onCopy}
          className="inline-flex items-center gap-1 font-mono font-bold text-amber-950 underline decoration-dotted hover:decoration-solid"
          aria-label={`Copy coupon code ${code}`}
        >
          {code}
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-600" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-amber-700" />
          )}
        </button>
        {discount ? ` at checkout for ${discount}` : " at checkout"}
      </span>
    </div>
  );
}
