"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { acronymsData as defaultAcronyms } from "../lib/acronyms";
import {
  Search,
  Check,
  ArrowUpDown,
  Grid,
  List,
  Clock,
  ChevronRight,
  Calendar,
  X,
  AlertCircle,
  Link as LinkIcon,
  ChevronDown,
} from "lucide-react";

// Wrap every case-insensitive occurrence of `query` inside `text` in a <mark> so
// search hits are visually highlighted. Regex specials in the query are escaped
// so a user typing "(" or "." can't break the matcher.
function highlightMatch(text: string, query: string): React.ReactNode {
  const q = query.trim();
  if (!q) return text;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === q.toLowerCase() ? (
      <mark key={i} className="rounded-sm bg-[#fdf0a8] text-inherit">
        {part}
      </mark>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
}

// Cross-fade between the link and check icons instead of swapping them. Both icons
// stay in the DOM (one absolute-positioned) so the copied/idle change animates on
// both enter and exit. Values follow the contextual-icon spec: scale 0.25 -> 1,
// opacity 0 -> 1, blur 4px -> 0, eased with cubic-bezier(0.2, 0, 0, 1).
function CopyStateIcon({ copied, size }: { copied: boolean; size: string }) {
  const base = `absolute ${size} transition-[opacity,scale,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]`;
  const shown = "opacity-100 scale-100 blur-0";
  const hidden = "opacity-0 scale-[0.25] blur-[4px]";
  return (
    <span className={`relative inline-flex ${size} items-center justify-center`}>
      <LinkIcon className={`${base} ${copied ? hidden : shown}`} />
      <Check className={`${base} text-emerald-600 ${copied ? shown : hidden}`} />
    </span>
  );
}

export default function Directory() {
  // Static directory data — available at build time so it renders on the server.
  const acronyms = defaultAcronyms;
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("acronym-asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Selected detail state
  const [selectedId, setSelectedId] = useState<string>(defaultAcronyms[0]?.id ?? "");

  // Notification tooltip states (maps acronymId -> boolean when copied)
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  // Profile Modal visibility
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Ref to the dialog container so focus can move into it when the modal opens.
  const modalRef = useRef<HTMLDivElement>(null);

  // Refs for keyboard-driven navigation: "/" jumps to search, arrow keys move
  // between the rendered cards inside the grid container.
  const searchInputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Move keyboard focus to the card at `index` (clamped to the rendered range).
  const focusCard = (index: number) => {
    const cards = gridRef.current?.querySelectorAll<HTMLElement>("[data-card-index]");
    if (!cards || cards.length === 0) return;
    const clamped = Math.max(0, Math.min(index, cards.length - 1));
    cards[clamped]?.focus();
  };

  // Global "/" shortcut focuses the search box — unless the user is already
  // typing in a field or the modal is open.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isModalOpen) return;
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
      searchInputRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isModalOpen]);

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

  // Close the modal and drop ?id= from the URL. If we pushed a history entry when
  // opening (the common case), pop it with back() so the popstate handler does the
  // closing and the entry doesn't linger. If the user instead deep-linked straight
  // to ?id=, there's nothing to pop, so just rewrite the URL in place.
  const closeModal = useCallback(() => {
    if (window.history.state?.acronymModal) {
      window.history.back();
    } else {
      window.history.replaceState({}, "", window.location.pathname);
      setIsModalOpen(false);
    }
  }, []);

  // Keep modal state in sync with browser navigation: Back/Forward (and our own
  // back() above) land here, where the URL's ?id= is the single source of truth.
  useEffect(() => {
    const onPopState = () => {
      const idParam = new URLSearchParams(window.location.search).get("id");
      if (idParam && defaultAcronyms.some((a) => a.id === idParam)) {
        setSelectedId(idParam);
        setIsModalOpen(true);
      } else {
        setIsModalOpen(false);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Modal keyboard behavior: Escape closes; focus moves into the dialog on open.
  useEffect(() => {
    if (!isModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", onKeyDown);
    modalRef.current?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isModalOpen, closeModal]);

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
    const query = searchTerm.toLowerCase().trim();
    let result = [...acronyms];

    // Filter by text search (acronym, name, or description matches)
    if (query !== "") {
      result = result.filter(
        a =>
          a.acronym.toLowerCase().includes(query) ||
          a.fullName.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query)
      );
    }

    // Relevance tier: where the query was found, lower is stronger. Used as the
    // primary sort key while searching so an acronym hit beats a description hit.
    const relevance = (a: (typeof acronyms)[number]) => {
      const ac = a.acronym.toLowerCase();
      if (ac === query) return 0;
      if (ac.startsWith(query)) return 1;
      if (ac.includes(query)) return 2;
      if (a.fullName.toLowerCase().includes(query)) return 3;
      return 4; // matched on description only
    };

    // The user's chosen sort — also the tie-breaker within a relevance tier.
    const bySort = (a: (typeof acronyms)[number], b: (typeof acronyms)[number]) => {
      switch (sortBy) {
        case "acronym-asc":
          return a.acronym.localeCompare(b.acronym);
        case "acronym-desc":
          return b.acronym.localeCompare(a.acronym);
        case "est-desc":
        case "est-asc": {
          // Entries with no established year always sort to the bottom, regardless
          // of direction — use ±Infinity as the missing-value sentinel.
          const ya = a.established ? parseInt(a.established) : (sortBy === "est-asc" ? Infinity : -Infinity);
          const yb = b.established ? parseInt(b.established) : (sortBy === "est-asc" ? Infinity : -Infinity);
          return sortBy === "est-asc" ? ya - yb : yb - ya;
        }
        default:
          return 1;
      }
    };

    result.sort((a, b) => {
      // While searching, strongest matches surface first; the chosen sort breaks ties.
      if (query !== "") {
        const tier = relevance(a) - relevance(b);
        if (tier !== 0) return tier;
      }
      return bySort(a, b);
    });

    return result;
  }, [acronyms, searchTerm, sortBy]);

  const handleSelectCard = (id: string) => {
    setSelectedId(id);
    setIsModalOpen(true);
    // Push a history entry tagged so closeModal/Back knows it can pop it. This
    // makes the modal shareable (URL carries ?id=) and Back-button dismissable.
    window.history.pushState({ acronymModal: true }, "", `${window.location.pathname}?id=${id}`);
  };

  return (
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
                ref={searchInputRef}
                type="text"
                className="w-full pl-10 pr-10 py-3 text-xs bg-[#fdfdfd] rounded-lg border border-[#e0e0e0] text-[#1a1a1a] placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#adc2d2]/30 focus:border-[#2a4d69] focus:outline-none transition"
                placeholder="Query acronyms (e.g. NHT, HEART), full expanded names, or description keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    focusCard(0);
                  }
                }}
                id="acronym-search-input"
              />
              {searchTerm ? (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                  id="clear-search-btn"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <kbd className="pointer-events-none absolute inset-y-0 right-3 my-auto hidden h-5 items-center rounded border border-[#e0e0e0] bg-white px-1.5 font-mono text-[10px] font-semibold text-slate-400 sm:flex">
                  /
                </kbd>
              )}
            </div>

            {/* Layout controls & Sorting dropdown */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">

              {/* Sort Order */}
              <div className="relative flex items-center text-xs font-semibold text-slate-700 bg-white border border-[#e0e0e0] rounded-lg hover:bg-slate-50 transition focus-within:ring-2 focus-within:ring-[#2a4d69]/20 focus-within:border-[#2a4d69]">
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
                  <option value="est-desc" className="font-medium">Sort: Established (Newest)</option>
                  <option value="est-asc" className="font-medium">Sort: Established (Oldest)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 pr-2.5 flex items-center">
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </div>
              </div>

              {/* Grid/List Toggle */}
              <div className="flex bg-[#f5f5f5] rounded-[10px] p-1 shrink-0 border border-[#e0e0e0]/50">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-md transition active:scale-[0.96] ${
                    viewMode === "grid" ? "bg-white text-slate-800 shadow-2xs" : "text-slate-400 hover:text-slate-600"
                  }`}
                  id="grid-layout-btn"
                  title="Grid View"
                >
                  <Grid className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-md transition active:scale-[0.96] ${
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

        </div>
      </div>

      {/* Master Registry Area (Full Width Grid Layout) */}
      <div className="w-full flex flex-col gap-4" id="registry-layout-row">

        {/* Quick counters & Registry indicators */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <p className="text-xs text-slate-500">
            Showing <strong className="text-slate-700 tabular-nums">{filteredAndSortedAcronyms.length}</strong> matching acronyms
          </p>

          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-xs font-bold text-[#2a4d69] hover:text-[#1d354b] transition active:scale-[0.96]"
              id="clear-all-filters-btn"
            >
              Clear search
            </button>
          )}
        </div>

        {filteredAndSortedAcronyms.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#adc2d2] bg-white p-12 text-center" id="empty-state-view">
            <AlertCircle className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 text-base font-bold text-slate-800 text-balance">No Acronyms Found</h3>
            <p className="mt-2 text-xs text-slate-500 max-w-md mx-auto text-pretty">
              We couldn&apos;t find any results matching your search. Try entering a different keyword,
              or clearing the search to browse the full list.
            </p>
            <button
              onClick={() => setSearchTerm("")}
              className="mt-5 rounded-lg bg-[#2a4d69] px-4 py-2 text-xs font-bold text-white hover:bg-[#1d354b] transition active:scale-[0.96]"
              id="reset-empty-filters-btn"
            >
              Show All Acronyms
            </button>
          </div>
        ) : (
          <div
            ref={gridRef}
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                : "flex flex-col gap-3.5"
            }
            id="acronyms-items-container"
          >
             {filteredAndSortedAcronyms.map((item, idx) => {
              const isSelected = item.id === selectedId;
              const isCopied = copiedStates[item.id] || false;

              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  data-card-index={idx}
                  aria-label={`View details for ${item.acronym} — ${item.fullName}`}
                  onClick={() => handleSelectCard(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelectCard(item.id);
                    } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                      e.preventDefault();
                      focusCard(idx + 1);
                    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                      e.preventDefault();
                      if (idx === 0) searchInputRef.current?.focus();
                      else focusCard(idx - 1);
                    }
                  }}
                  className={`relative flex flex-col justify-between p-5 rounded-xl border transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2a4d69]/40 ${
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
                          {highlightMatch(item.acronym, searchTerm)}
                        </span>
                        {item.established && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500 font-mono tabular-nums flex items-center gap-0.5">
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
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition active:scale-[0.96]"
                          title="Copy link"
                          id={`copy-btn-${item.id}`}
                        >
                          <CopyStateIcon copied={isCopied} size="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Agency Subtitle */}
                    <p className={`mt-2 text-xs font-bold text-pretty ${isSelected ? "text-[#2a4d69]" : "text-slate-700"}`}>
                      {highlightMatch(item.fullName, searchTerm)}
                    </p>

                    {/* Short Description */}
                    <p className="mt-3 text-xs text-slate-500 line-clamp-3 leading-relaxed font-light text-pretty">
                      {highlightMatch(item.description, searchTerm)}
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

      {/* PROFESSIONAL PROFILE INTEGRATED MODAL */}
      {isModalOpen && currentSelectedAcronym && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
          id="profile-detail-modal"
          onClick={() => closeModal()}
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
            {/* Profile Content Body */}
            <div className="p-6 md:p-8 flex flex-col gap-6 overflow-y-auto max-h-[80vh]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2
                    id="profile-modal-title"
                    className="text-4xl font-black font-display tracking-tight text-[#1a1a1a]"
                  >
                    {currentSelectedAcronym.acronym}
                  </h2>
                  <h3 className="mt-2 text-sm font-bold text-slate-700 leading-relaxed font-sans text-balance">
                    {currentSelectedAcronym.fullName}
                  </h3>
                </div>
                <div className="flex items-center gap-1 shrink-0 -mt-1 -mr-1">
                  <button
                    onClick={(e) => {
                      const shareObj = new URL(window.location.href);
                      shareObj.searchParams.set("id", currentSelectedAcronym.id);
                      handleCopyText(`share-${currentSelectedAcronym.id}`, shareObj.toString(), e, "Link copied to clipboard");
                    }}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition active:scale-[0.96]"
                    title="Copy link"
                  >
                    <CopyStateIcon
                      copied={!!copiedStates[`share-${currentSelectedAcronym.id}`]}
                      size="h-5 w-5"
                    />
                  </button>
                  <button
                    onClick={() => closeModal()}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition active:scale-[0.96]"
                    id="close-modal-x-btn"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="border-y border-slate-100 py-4 font-mono text-xs">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Established</span>
                  <span className="mt-1 block font-semibold text-slate-700 tabular-nums flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-[#2a4d69] shrink-0" />
                    {currentSelectedAcronym.established || "N/A"}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Overview</h4>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 font-light whitespace-pre-line text-pretty">
                  {currentSelectedAcronym.description}
                </p>
              </div>
            </div>

            {/* Modal Bottom Actions Footer */}
            <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-end shrink-0">
              <button
                onClick={() => closeModal()}
                className="rounded-lg bg-[#2a4d69] px-6 py-2 text-xs font-bold text-white hover:bg-[#1d354b] transition active:scale-[0.96] focus:outline-none"
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
    </>
  );
}
