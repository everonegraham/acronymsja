"use client";

import { useState, useEffect, useCallback } from "react";
import { acronymsData, CATEGORY_META } from "../lib/acronyms";
import type { Acronym } from "../lib/acronyms";
import Confetti from "./Confetti";
import {
  Target,
  Check,
  X,
  Lock,
  Calendar,
  CornerDownLeft,
} from "lucide-react";

const MAX_GUESSES = 5;

// Joke / fabricated entries (category "other") never appear as a daily answer.
const POOL = acronymsData.filter((a) => a.category !== "other");

// Calendar-day key in the visitor's local time, e.g. "2026-6-23". Everyone in the
// same day gets the same puzzle.
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// Small deterministic string hash → the day's pick is stable for a given date.
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// Compare ignoring case and any non-alphanumerics, so "HEART/NSTA" matches
// "heart nsta", "heartnsta", etc.
function normalize(s: string): string {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

type Status = "playing" | "won" | "lost";

interface SavedState {
  guesses: string[];
  status: Status;
}

export default function Daily() {
  const [entry, setEntry] = useState<Acronym | null>(null);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("playing");
  const [input, setInput] = useState("");
  const [ready, setReady] = useState(false);
  const [storageKey, setStorageKey] = useState("");

  // Resolve today's puzzle and restore any saved progress — done after mount so
  // the date-dependent pick can't cause an SSR/client hydration mismatch.
  useEffect(() => {
    const key = dayKey(new Date());
    const pick = POOL[hashString(key) % POOL.length];
    const lsKey = `acronyms-daily-${key}`;
    let saved: SavedState | null = null;
    try {
      const raw = localStorage.getItem(lsKey);
      if (raw) saved = JSON.parse(raw) as SavedState;
    } catch {
      /* ignore malformed storage */
    }
    // Date- and storage-derived state is only knowable on the client, so it must
    // be set here after mount — the static prerender has no date or localStorage.
    /* eslint-disable react-hooks/set-state-in-effect */
    setEntry(pick);
    setStorageKey(lsKey);
    if (saved) {
      setGuesses(saved.guesses ?? []);
      setStatus(saved.status ?? "playing");
    }
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const persist = useCallback(
    (next: SavedState) => {
      if (!storageKey) return;
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* storage may be unavailable (private mode) — game still works in-session */
      }
    },
    [storageKey],
  );

  const submitGuess = () => {
    if (status !== "playing" || !entry) return;
    const value = input.trim();
    if (!value) return;

    const nextGuesses = [...guesses, value];
    const correct = normalize(value) === normalize(entry.acronym);
    const nextStatus: Status = correct
      ? "won"
      : nextGuesses.length >= MAX_GUESSES
        ? "lost"
        : "playing";

    setGuesses(nextGuesses);
    setStatus(nextStatus);
    setInput("");
    persist({ guesses: nextGuesses, status: nextStatus });
  };

  // ---- Loading placeholder (pre-hydration / before effect runs) ------------
  if (!ready || !entry) {
    return (
      <div className="w-full max-w-xl mx-auto py-8">
        <div className="h-40 rounded-xl border border-[#e0e0e0] bg-white animate-pulse" />
      </div>
    );
  }

  const finished = status !== "playing";
  const remaining = MAX_GUESSES - guesses.length;

  return (
    <div className="animate-fade-in w-full max-w-xl mx-auto py-4 space-y-6">
      {status === "won" && <Confetti />}

      {/* Header */}
      <div className="text-center space-y-3">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2a4d69]/10 text-[#2a4d69]">
          <Target className="h-7 w-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 text-balance">
            Daily Puzzle
          </h2>
          <p className="text-sm text-slate-500 font-light leading-relaxed max-w-md mx-auto text-pretty">
            One entity a day. No letters, no blanks — just the clue. Work backwards
            and name the acronym.
          </p>
        </div>
      </div>

      {/* Clue card */}
      <div className="rounded-xl border border-[#e0e0e0] bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${CATEGORY_META[entry.category].badge}`}
          >
            {CATEGORY_META[entry.category].label}
          </span>
          {entry.established && (
            <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 font-mono tabular-nums">
              <Calendar className="h-2.5 w-2.5" />
              Est. {entry.established}
            </span>
          )}
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            The clue
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-700 font-light text-pretty">
            {entry.description}
          </p>
        </div>
      </div>

      {/* Input / result — stays in a fixed spot; guesses render below it so the
          typing area never gets pushed down as attempts accumulate. */}
      {!finished ? (
        <div className="space-y-3">
          <div className="flex items-stretch gap-2">
            <input
              type="text"
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitGuess();
              }}
              placeholder="Type the acronym…"
              aria-label="Your guess"
              className="flex-1 rounded-lg border border-[#e0e0e0] bg-[#fdfdfd] px-4 py-3 text-sm font-bold uppercase tracking-wide text-slate-900 placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 focus:bg-white focus:border-[#2a4d69] focus:ring-2 focus:ring-[#adc2d2]/30 focus:outline-none transition"
              id="daily-input"
            />
            <button
              onClick={submitGuess}
              disabled={!input.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#2a4d69] px-5 text-xs font-bold text-white transition active:scale-[0.96] enabled:hover:bg-[#1d354b] disabled:opacity-40 disabled:cursor-not-allowed"
              id="daily-submit-btn"
            >
              Guess
              <CornerDownLeft className="h-3.5 w-3.5" />
            </button>
          </div>
          {/* Attempts indicator */}
          <div className="flex items-center justify-center gap-1.5">
            {Array.from({ length: MAX_GUESSES }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  i < guesses.length ? "bg-red-300" : "bg-slate-200"
                }`}
              />
            ))}
            <span className="ml-1.5 text-xs text-slate-400 font-mono tabular-nums">
              {remaining} left
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-[#e0e0e0] bg-slate-50/60 p-6 text-center space-y-2">
          {status === "won" ? (
            <p className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600">
              <Check className="h-4 w-4" /> Solved in {guesses.length}{" "}
              {guesses.length === 1 ? "guess" : "guesses"}!
            </p>
          ) : (
            <p className="inline-flex items-center gap-1.5 text-sm font-bold text-red-500">
              <X className="h-4 w-4" /> Out of guesses
            </p>
          )}
          <p className="text-2xl font-black font-display tracking-tight text-slate-900">
            {entry.acronym}
          </p>
          <p className="text-sm font-bold text-slate-700 text-balance">{entry.fullName}</p>
          <p className="flex items-center justify-center gap-1.5 pt-2 text-xs text-slate-400 font-mono">
            <Lock className="h-3 w-3" />
            Come back tomorrow for a new puzzle
          </p>
        </div>
      )}

      {/* Guess history — compact chips that wrap, instead of full-width bars. */}
      {guesses.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {guesses.map((g, i) => {
            const correct = normalize(g) === normalize(entry.acronym);
            return (
              <span
                key={i}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide ring-1 ${
                  correct
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-red-50 text-red-500 ring-red-200"
                }`}
              >
                <span className={correct ? "" : "line-through decoration-red-300/70"}>{g}</span>
                {correct ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
