"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { acronymsData as defaultAcronyms, CATEGORIES } from "../lib/acronyms";
import { siteConfig } from "../lib/site";
import Header from "./Header";
import {
  Search,
  Filter,
  Check,
  ArrowUpDown,
  Grid,
  List,
  BookOpen,
  Clock,
  ChevronRight,
  Calendar,
  X,
  AlertCircle,
  HelpCircle,
  Link as LinkIcon,
  ChevronDown,
} from "lucide-react";

export default function AcronymsApp() {
  // Static directory data — available at build time so it renders on the server.
  const acronyms = defaultAcronyms;
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("acronym-asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Selected detail state
  const [selectedId, setSelectedId] = useState<string>(defaultAcronyms[0]?.id ?? "");

  // Notification tooltip states (maps acronymId -> boolean when copied)
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  // Profile Modal visibility
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Active view tab state (listing vs about us)
  const [currentTab, setCurrentTab] = useState<"listing" | "about">("listing");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Ref to the dialog container so focus can move into it when the modal opens.
  const modalRef = useRef<HTMLDivElement>(null);

  // Deep link: open the modal for ?id=<acronym id> on first load. This runs only
  // on the client after hydration — the static prerender has no query string —
  // so setting state here is correct despite the set-state-in-effect rule.
  useEffect(() => {
    const idParam = new URLSearchParams(window.location.search).get("id");
    if (idParam && defaultAcronyms.some((a) => a.id === idParam)) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setSelectedId(idParam);
      setIsModalOpen(true);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, []);

  // Modal keyboard behavior: Escape closes; focus moves into the dialog on open.
  useEffect(() => {
    if (!isModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    modalRef.current?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isModalOpen]);

  // Copy text to clipboard indicator helper
  const handleCopyText = (id: string, text: string, e: React.MouseEvent, toastMsg?: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    if (toastMsg) {
       setToastMessage(toastMsg);
       setTimeout(() => setToastMessage(null), 3000);
    }
    setCopiedStates(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [id]: false }));
    }, 1800);
  };

  // Find currently highlighted acronym detail
  const currentSelectedAcronym = useMemo(() => {
    return acronyms.find(a => a.id === selectedId) || null;
  }, [acronyms, selectedId]);

  // Search & Filter & Sort Pipeline
  const filteredAndSortedAcronyms = useMemo(() => {
    let result = [...acronyms];

    // Filter by selected category pill
    if (selectedCategory !== "All Categories") {
      result = result.filter(a => a.category === selectedCategory);
    }

    // Filter by text search (acronym, name, or description matches)
    if (searchTerm.trim() !== "") {
      const query = searchTerm.toLowerCase().trim();
      result = result.filter(
        a =>
          a.acronym.toLowerCase().includes(query) ||
          a.fullName.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query)
      );
    }

    // Sort order logic
    result.sort((a, b) => {
      switch (sortBy) {
        case "acronym-asc":
          return a.acronym.localeCompare(b.acronym);
        case "acronym-desc":
          return b.acronym.localeCompare(a.acronym);
        case "est-desc":
          // Handle agencies with undefined establishment years by placing them at the bottom
          const ya = a.established ? parseInt(a.established) : 0;
          const yb = b.established ? parseInt(b.established) : 0;
          return yb - ya;
        default:
          return 1;
      }
    });

    return result;
  }, [acronyms, selectedCategory, searchTerm, sortBy]);

  const handleSelectCard = (id: string) => {
    setSelectedId(id);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#fcfdfd] text-slate-800 flex flex-col font-sans selection:bg-[#adc2d2]/40 selection:text-[#1a1a1a]" id="spa-layout-root">

      {/* Prime Header Component */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
      />

      <main className="flex-1 w-full mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col gap-8">
        {currentTab === "listing" ? (
          <>
            {/* Search, Filter console */}
        <div className="rounded-xl border border-[#e0e0e0] bg-white p-5 shadow-xs" id="control-dashboard">
          <div className="flex flex-col gap-4">

            {/* Search Input and sorting settings */}
            <div className="flex flex-col md:flex-row gap-3.5 items-stretch md:items-center justify-between">

              {/* Sleek Search Frame */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Search className="h-4.5 w-4.5" />
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-10 py-3 text-xs bg-[#fdfdfd] rounded-lg border border-[#e0e0e0] text-[#1a1a1a] placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#adc2d2]/30 focus:border-[#2a4d69] focus:outline-none transition-all"
                  placeholder="Query acronyms (e.g. NHT, HEART), full expanded names, or description keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  id="acronym-search-input"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                    id="clear-search-btn"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Layout controls & Sorting dropdown */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">

                {/* Sort Order */}
                <div className="relative flex items-center text-xs font-semibold text-slate-700 bg-white border border-[#e0e0e0] rounded-lg hover:bg-slate-50 transition-all focus-within:ring-2 focus-within:ring-[#2a4d69]/20 focus-within:border-[#2a4d69]">
                  <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <select
                    className="w-full appearance-none bg-transparent border-none py-2 pl-8 pr-8 focus:outline-none font-bold cursor-pointer m-0 leading-tight"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    id="sort-option-select"
                  >
                    <option value="acronym-asc" className="font-medium">Sort: A to Z (Acronym)</option>
                    <option value="acronym-desc" className="font-medium">Sort: Z to A (Acronym)</option>
                    <option value="est-desc" className="font-medium">Sort: Established Year</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 pr-2.5 flex items-center">
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </div>
                </div>

                {/* Grid/List Toggle */}
                <div className="flex bg-[#f5f5f5] rounded-lg p-1 shrink-0 border border-[#e0e0e0]/50">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded-md transition ${
                      viewMode === "grid" ? "bg-white text-slate-800 shadow-2xs" : "text-slate-400 hover:text-slate-600"
                    }`}
                    id="grid-layout-btn"
                    title="Grid View"
                  >
                    <Grid className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-1.5 rounded-md transition ${
                      viewMode === "list" ? "bg-white text-slate-800 shadow-2xs" : "text-slate-400 hover:text-slate-600"
                    }`}
                    id="list-layout-btn"
                    title="List View"
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                </div>

              </div>
            </div>

            {/* Horizontal Scrollable Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 -mx-5 px-5 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0 mr-2 flex items-center gap-1">
                <Filter className="h-3 w-3" /> Filters:
              </span>
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-[11px] font-bold whitespace-nowrap transition-all border ${
                      isActive
                        ? "bg-[#2a4d69] border-[#2a4d69] text-white shadow-xs"
                        : "bg-[#fdfdfd] border-[#e0e0e0] text-slate-600 hover:border-[#adc2d2] hover:bg-slate-50"
                    }`}
                    id={`filter-pill-${cat.replace(/\s+/g, "-").toLowerCase()}`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

          </div>
        </div>

        {/* Master Registry Area (Full Width Grid Layout) */}
        <div className="w-full flex flex-col gap-4" id="registry-layout-row">

          {/* Quick counters & Registry indicators */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <p className="text-xs text-slate-500">
              Showing <strong className="text-slate-700">{filteredAndSortedAcronyms.length}</strong> matching acronyms
              {selectedCategory !== "All Categories" && ` in "${selectedCategory}"`}
            </p>

            {(searchTerm || selectedCategory !== "All Categories") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("All Categories");
                }}
                className="text-xs font-bold text-[#2a4d69] hover:text-[#1d354b] transition-all"
                id="clear-all-filters-btn"
              >
                Clear all filters
              </button>
            )}
          </div>

          {filteredAndSortedAcronyms.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#adc2d2] bg-white p-12 text-center" id="empty-state-view">
              <AlertCircle className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-4 text-base font-bold text-slate-800">No Acronyms Found</h3>
              <p className="mt-2 text-xs text-slate-500 max-w-md mx-auto">
                We couldn&apos;t find any results matching your filters. Try entering a different keyword,
                adding a custom acronym, or clearing active category guidelines.
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("All Categories");
                }}
                className="mt-5 rounded-lg bg-[#2a4d69] px-4 py-2 text-xs font-bold text-white hover:bg-[#1d354b] transition-all"
                id="reset-empty-filters-btn"
              >
                Show All Acronyms
              </button>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                  : "flex flex-col gap-3.5"
              }
              id="acronyms-items-container"
            >
               {filteredAndSortedAcronyms.map((item) => {
                const isSelected = item.id === selectedId;
                const isCopied = copiedStates[item.id] || false;

                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`View details for ${item.acronym} — ${item.fullName}`}
                    onClick={() => handleSelectCard(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelectCard(item.id);
                      }
                    }}
                    className={`relative flex flex-col justify-between p-5 rounded-xl border transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2a4d69]/40 ${
                      isSelected
                        ? "bg-[#f0f4f8] border-[#adc2d2] ring-2 ring-[#2a4d69]/10 shadow-xs"
                        : "bg-white border-[#e0e0e0] hover:border-[#adc2d2] hover:shadow-xs"
                    }`}
                    id={`acronym-card-${item.id}`}
                  >
                    <div className="w-full">
                      {/* Header: Acronym and Copy buttons */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black font-display tracking-tight text-slate-900">
                            {item.acronym}
                          </span>
                          {item.established && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500 font-mono flex items-center gap-0.5">
                              <Clock className="h-2 w-2" />
                              {item.established}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {/* Copy button */}
                          <button
                            onClick={(e) => {
                              const shareObj = new URL(window.location.href);
                              shareObj.searchParams.set("id", item.id);
                              handleCopyText(item.id, shareObj.toString(), e, "Link copied to clipboard");
                            }}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
                            title="Copy link"
                            id={`copy-btn-${item.id}`}
                          >
                            {isCopied ? (
                              <Check className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <LinkIcon className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Agency Subtitle */}
                      <p className={`mt-2 text-xs font-bold ${isSelected ? "text-[#2a4d69]" : "text-slate-700"}`}>
                        {item.fullName}
                      </p>

                      {/* Category Label */}
                      <span className="mt-3 inline-block rounded-md bg-[#f0f4f8] px-2.5 py-0.5 text-[10px] font-bold text-[#2a4d69] uppercase tracking-wider font-mono">
                        {item.category}
                      </span>

                      {/* Short Description */}
                      <p className="mt-3 text-xs text-slate-500 line-clamp-3 leading-relaxed font-light">
                        {item.description}
                      </p>
                    </div>

                    {/* Card Bottom Indicator decoration */}
                    <div className="mt-5 flex items-center justify-end pt-3 border-t border-slate-100/75">
                      <span className="text-xs font-bold text-[#2a4d69] flex items-center gap-0.5 hover:translate-x-0.5 transition-transform">
                        Details
                        <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>
          </>
        ) : (
          <div className="animate-fade-in w-full max-w-3xl mx-auto space-y-12 py-4" id="about-us-container">
            {/* Hero / Philosophy Section */}
            <div className="text-center space-y-4">
              <span className="inline-flex rounded-full bg-[#2a4d69]/10 px-3 py-1 text-[10.5px] font-bold text-[#2a4d69] font-mono uppercase tracking-widest">
                Our Purpose
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
                About Acronyms JA
              </h2>
              <p className="text-slate-500 font-light leading-relaxed text-sm max-w-xl mx-auto">
                Acronyms JA is a simple tool to help everyone figure out what Jamaican acronyms stand for. No more guessing.
              </p>
            </div>

            {/* Grid Block: Three main columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3 shadow-2xs hover:border-[#adc2d2]/65 transition-all">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2a4d69]/10 text-[#2a4d69]">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">1. Making it Clear</h3>
                <p className="text-xs text-slate-500 font-light leading-relaxed">
                  Jamaica is full of acronyms — across government, business, education, and everyday life. We put together this directory so you can easily look up those confusing initials and abbreviations.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3 shadow-2xs hover:border-[#adc2d2]/65 transition-all">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2a4d69]/10 text-[#2a4d69]">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">2. Helpful Info</h3>
                <p className="text-xs text-slate-500 font-light leading-relaxed">
                  For each entry, we provide the full name, the year it was founded, and a brief description of what the organization actually does.
                </p>
              </div>
            </div>

            {/* Detailed Guide Panel */}
            <div className="rounded-xl border border-[#adc2d2]/30 bg-slate-50/50 p-6 md:p-8 space-y-6">
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-extrabold text-[#2a4d69] uppercase tracking-wider">Categories</h4>
                <p className="text-xs text-slate-500 font-light max-w-2xl leading-normal">
                  We&apos;ve organized entries into the following categories to make them easier to browse:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5 font-sans">
                {CATEGORIES.map((cat, i) => (
                  <div key={cat} className="flex gap-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2a4d69]/20 text-[#2a4d69] text-[10px] font-mono font-bold shrink-0 mt-0.5">
                      0{i+1}
                    </span>
                    <div>
                      <span className="block text-xs font-bold text-slate-800">{cat}</span>
                      <span className="block text-[11px] text-slate-500 font-light mt-0.5">
                        Acronyms related to {cat.toLowerCase()}.
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Action bar: Submit form or browse listings */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-slate-200 text-center">
              <button
                onClick={() => setCurrentTab("listing")}
                className="w-full sm:w-auto rounded-lg bg-[#2a4d69] hover:bg-[#1e3d59] text-white font-bold text-xs px-6 py-2.5 transition duration-150 text-center cursor-pointer"
              >
                Browse List
              </button>
              <a
                href={siteConfig.proposeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto rounded-lg border border-slate-200 hover:border-[#adc2d2]/60 hover:bg-slate-50 text-slate-600 font-bold text-xs px-6 py-2.5 transition duration-150 text-center"
              >
                Propose
              </a>
            </div>
          </div>
        )}

      </main>

      {/* Footer Disclaimer */}
      <footer className="w-full border-t border-[#e0e0e0] py-5 mt-auto shrink-0 bg-[#fcfdfd]">
        <p className="text-[11px] text-slate-400 text-center font-light leading-relaxed px-4">
          Disclaimer: The information listed in this acronym directory represents public reference material gathered for educational purposes.
        </p>
      </footer>

      {/* PROFESSIONAL PROFILE INTEGRATED MODAL */}
      {isModalOpen && currentSelectedAcronym && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
          id="profile-detail-modal"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            ref={modalRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-modal-title"
            className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-up border border-[#adc2d2]/45 focus:outline-none"
            id="profile-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header banner */}
            <div className="bg-[#f0f4f8] border-b border-[#e0e0e0] px-6 py-4 flex items-center justify-between">
              <span className="inline-block rounded bg-[#2a4d69]/10 px-2.5 py-1 text-[10px] font-bold text-[#2a4d69] font-mono uppercase tracking-wider">
                {currentSelectedAcronym.category}
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 rounded-full transition-all"
                id="close-modal-x-btn"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Profile Content Body */}
            <div className="p-6 md:p-8 flex flex-col gap-6 overflow-y-auto max-h-[70vh]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2
                    id="profile-modal-title"
                    className="text-4xl font-black font-display tracking-tight text-[#1a1a1a]"
                  >
                    {currentSelectedAcronym.acronym}
                  </h2>
                  <h3 className="mt-2 text-sm font-bold text-slate-700 leading-relaxed font-sans">
                    {currentSelectedAcronym.fullName}
                  </h3>
                </div>
                <button
                  onClick={(e) => {
                    const shareObj = new URL(window.location.href);
                    shareObj.searchParams.set("id", currentSelectedAcronym.id);
                    handleCopyText(`share-${currentSelectedAcronym.id}`, shareObj.toString(), e, "Link copied to clipboard");
                  }}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition shrink-0 mt-1"
                  title="Copy link"
                >
                  {copiedStates[`share-${currentSelectedAcronym.id}`] ? (
                    <Check className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <LinkIcon className="h-5 w-5" />
                  )}
                </button>
              </div>

              <div className="border-y border-slate-100 py-4 font-mono text-xs">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Established</span>
                  <span className="mt-1 block font-semibold text-slate-700 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-[#2a4d69] shrink-0" />
                    {currentSelectedAcronym.established || "N/A"}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Overview</h4>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 font-light whitespace-pre-line">
                  {currentSelectedAcronym.description}
                </p>
              </div>
            </div>

            {/* Modal Bottom Actions Footer */}
            <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-end shrink-0">
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg bg-[#2a4d69] px-6 py-2 text-xs font-bold text-white hover:bg-[#1d354b] transition-all focus:outline-none"
                id="modal-close-action-btn"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-full shadow-lg text-sm font-medium flex items-center gap-2 animate-fade-in-up">
          <Check className="h-4 w-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

    </div>
  );
}
