import Link from "next/link";
import { StateSelector } from "./StateSelector";
import Image from "next/image";

export function Header() {
  return (
    <header className="bg-primary text-white">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-90">
          {/* Logo icon — teal circle with grad cap + chevron */}
          <svg width="36" height="36" viewBox="100 40 114 114" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="157" cy="97" r="55" fill="#085041"/>
            <circle cx="157" cy="97" r="51" fill="#1D9E75"/>
            <polygon points="157,58 187,72 157,86 127,72" fill="white"/>
            <rect x="145" y="86" width="24" height="13" rx="3" fill="white"/>
            <line x1="187" y1="72" x2="187" y2="94" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="187" cy="97" r="4" fill="white"/>
            <path d="M 140,114 L 157,132 L 174,114" fill="none" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {/* Wordmark — white on dark background */}
          <span className="text-lg font-medium tracking-tight">
            <span className="text-white">trafficschool</span>
            <span className="text-emerald-400">picker</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/about" className="hover:text-highlight transition-colors">
            How We Rank
          </Link>
          <Link href="/blog" className="hover:text-highlight transition-colors">
            Blog
          </Link>
          <StateSelector size="sm" />
        </nav>
      </div>
    </header>
  );
}
