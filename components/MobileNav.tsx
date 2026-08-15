"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { StateSelector } from "./StateSelector";

const LINKS = [
  { href: "/schools", label: "All Schools" },
  { href: "/reviews", label: "Reviews" },
  { href: "/about", label: "How We Rank" },
  { href: "/blog", label: "Blog" },
];

/**
 * Mobile navigation — a hamburger toggle that drops down the same links as the
 * desktop nav (which is `hidden md:flex`). Without this, sub-`md` viewports
 * (every phone) had no navigation at all. Shown only below `md`.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-nav"
        className="p-2 -mr-2 text-white hover:text-highlight transition-colors"
      >
        {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {open && (
        <div
          id="mobile-nav"
          className="absolute left-0 right-0 top-full z-50 bg-primary border-t border-white/10 shadow-lg"
        >
          <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-2.5 text-base text-white hover:text-highlight transition-colors"
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-3">
              <StateSelector size="sm" />
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
