import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { StateSelector } from "./StateSelector";

export function Header() {
  return (
    <header className="bg-primary text-white">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90">
          <GraduationCap className="w-7 h-7" />
          <span className="text-lg font-bold tracking-tight">
            TrafficSchoolPicker
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
