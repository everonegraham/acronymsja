import Link from "next/link";
import { BookOpen, HelpCircle } from "lucide-react";
import { siteConfig } from "../lib/site";

export default function About() {
  return (
    <div className="animate-fade-in w-full max-w-3xl mx-auto space-y-12 py-4" id="about-us-container">
      {/* Hero / Philosophy Section */}
      <div className="text-center space-y-4">
        <span className="inline-flex rounded-full bg-[#2a4d69]/10 px-3 py-1 text-[10.5px] font-bold text-[#2a4d69] font-mono uppercase tracking-widest">
          Our Purpose
        </span>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans text-balance">
          About Acronyms JA
        </h2>
        <p className="text-slate-500 font-light leading-relaxed text-sm max-w-xl mx-auto text-pretty">
          Acronyms JA is a simple tool to help everyone figure out what Jamaican acronyms stand for. No more guessing.
        </p>
      </div>

      {/* Grid Block: Three main columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3 shadow-2xs hover:border-[#adc2d2]/65 transition">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2a4d69]/10 text-[#2a4d69]">
            <BookOpen className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">1. Making it Clear</h3>
          <p className="text-xs text-slate-500 font-light leading-relaxed text-pretty">
            Jamaica is full of acronyms — across government, business, education, and everyday life. We put together this directory so you can easily look up those confusing initials and abbreviations.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3 shadow-2xs hover:border-[#adc2d2]/65 transition">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2a4d69]/10 text-[#2a4d69]">
            <HelpCircle className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">2. Helpful Info</h3>
          <p className="text-xs text-slate-500 font-light leading-relaxed text-pretty">
            For each entry, we provide the full name, the year it was founded, and a brief description of what the organization actually does.
          </p>
        </div>
      </div>

      {/* Detailed Guide Panel */}
      <div className="rounded-xl border border-[#adc2d2]/30 bg-slate-50/50 p-6 md:p-8 space-y-4">
        <h4 className="text-xs font-mono font-extrabold text-[#2a4d69] uppercase tracking-wider">How to use it</h4>
        <p className="text-xs text-slate-500 font-light max-w-2xl leading-relaxed text-pretty">
          Search by the acronym itself (e.g. NHT, HEART), the full expanded name, or any keyword
          from the description. Tap any result to see its full name, the year it was established,
          and a short overview of what the organization does.
        </p>
      </div>

      {/* Quick Action bar: Submit form or browse listings */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-slate-200 text-center">
        <Link
          href="/"
          className="w-full sm:w-auto rounded-lg bg-[#2a4d69] hover:bg-[#1e3d59] text-white font-bold text-xs px-6 py-2.5 transition duration-150 active:scale-[0.96] text-center"
        >
          Browse List
        </Link>
        <a
          href={siteConfig.proposeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto rounded-lg border border-slate-200 hover:border-[#adc2d2]/60 hover:bg-slate-50 text-slate-600 font-bold text-xs px-6 py-2.5 transition duration-150 active:scale-[0.96] text-center"
        >
          Propose
        </a>
      </div>
    </div>
  );
}
