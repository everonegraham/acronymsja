"use client";

import { PlusCircle, Library } from "lucide-react";
import { siteConfig } from "../lib/site";

interface HeaderProps {
  currentTab: "listing" | "about";
  onTabChange: (tab: "listing" | "about") => void;
}

export default function Header({ currentTab, onTabChange }: HeaderProps) {
  return (
    <div className="w-full flex flex-col" id="app-header-container">
      {/* 1. SIMPLE, PREMIUM TOP NAVBAR */}
      <nav
        className="w-full h-15 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-center"
        id="top-simple-navbar"
      >
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-full">
          {/* Brand Identity / Left stamp */}
          <div className="flex items-center gap-3">
          <div
            className="flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-gradient-to-tr from-[#2a4d69] to-[#1a354c] text-white shadow-xs ring-4 ring-[#2a4d69]/5"
            id="app-branded-logo"
          >
            <Library className="h-4.5 w-4.5 text-[#81b29a]" />
          </div>
          <span className="font-sans text-[12px] font-black uppercase tracking-wider text-[#2a4d69] leading-tight">
            Acronyms JA
          </span>
        </div>

        {/* Right side item: Home, About Us links and Propose Button clustered next to each other */}
        <div className="flex items-center gap-4 sm:gap-6" id="navigation-cluster">
          {/* Centralized text navigation */}
          <div className="flex items-center gap-4 sm:gap-5 font-mono text-[10px] sm:text-[10.5px] font-extrabold uppercase tracking-widest">
            <button
              onClick={() => onTabChange("listing")}
              className={`transition-all py-1 cursor-pointer ${
                currentTab === "listing"
                  ? "text-[#2a4d69] border-b-2 border-[#2a4d69]"
                  : "text-slate-400 hover:text-slate-700"
              }`}
              id="nav-tab-home"
            >
              Home
            </button>
            <button
              onClick={() => onTabChange("about")}
              className={`transition-all py-1 cursor-pointer ${
                currentTab === "about"
                  ? "text-[#2a4d69] border-b-2 border-[#2a4d69]"
                  : "text-slate-400 hover:text-slate-700"
              }`}
              id="nav-tab-about"
            >
              About Us
            </button>
          </div>

          <div className="hidden sm:block h-4 w-px bg-slate-200"></div>

          {/* Form Trigger Button */}
          <a
            href={siteConfig.proposeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-[#2a4d69] hover:bg-[#1e3d59] duration-150 transition-all text-white font-bold text-[10.5px] sm:text-[11px] px-3.5 py-1.5 flex items-center gap-1.5 shadow-xs whitespace-nowrap"
            id="propose-acronym-google-form-btn"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Propose Acronym</span>
            <span className="inline sm:hidden">Propose</span>
          </a>
        </div>
        </div>
      </nav>
    </div>
  );
}
