"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { acronymsData } from "../lib/acronyms";
import type { Acronym } from "../lib/acronyms";
import Confetti from "./Confetti";
import {
  Puzzle,
  Check,
  X,
  ChevronRight,
  RotateCcw,
  Trophy,
  Lightbulb,
} from "lucide-react";

const ROUND_LENGTH = 10;

// Fisher–Yates shuffle — returns a new array, leaves the input untouched.
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

interface Round {
  entry: Acronym;
  blanks: number[]; // indices into entry.acronym that are hidden
}

// Build a round: pick distinct entries, and for each hide one or two of the
// acronym's letters (positions only — spaces/punctuation are never blanked, and
// at least one letter always stays visible).
function buildRound(pool: Acronym[], count: number): Round[] {
  return shuffle(pool)
    .slice(0, Math.min(count, pool.length))
    .map((entry) => {
      const letterPositions = [...entry.acronym]
        .map((c, i) => (/[a-z]/i.test(c) ? i : -1))
        .filter((i) => i >= 0);
      const hide = Math.min(letterPositions.length <= 3 ? 1 : 2, letterPositions.length - 1);
      const blanks = shuffle(letterPositions).slice(0, Math.max(1, hide)).sort((a, b) => a - b);
      return { entry, blanks };
    });
}

type Status = "idle" | "playing" | "finished";

export default function Guess() {
  const [status, setStatus] = useState<Status>("idle");
  const [rounds, setRounds] = useState<Round[]>([]);
  const [current, setCurrent] = useState(0);
  const [inputs, setInputs] = useState<Record<number, string>>({});
  const [answered, setAnswered] = useState(false);
  const [revealedHint, setRevealedHint] = useState(false);
  const [score, setScore] = useState(0);
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // Built in an event handler (never during render) so the random picks can't
  // cause an SSR/client hydration mismatch.
  const startRound = useCallback(() => {
    setRounds(buildRound(acronymsData, ROUND_LENGTH));
    setCurrent(0);
    setInputs({});
    setAnswered(false);
    setRevealedHint(false);
    setScore(0);
    setStatus("playing");
  }, []);

  const round = rounds[current];

  // Move focus to the first blank as each question appears.
  useEffect(() => {
    if (status !== "playing" || !round) return;
    inputRefs.current[round.blanks[0]]?.focus();
  }, [current, status, round]);

  const allFilled = round
    ? round.blanks.every((p) => (inputs[p] ?? "").trim().length > 0)
    : false;
  const isCorrect = round
    ? round.blanks.every(
        (p) => (inputs[p] ?? "").trim().toUpperCase() === round.entry.acronym[p].toUpperCase(),
      )
    : false;

  const handleCheck = () => {
    if (answered || !allFilled) return;
    setAnswered(true);
    if (isCorrect) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (current + 1 >= rounds.length) {
      setStatus("finished");
      return;
    }
    setCurrent((c) => c + 1);
    setInputs({});
    setAnswered(false);
    setRevealedHint(false);
  };

  const setLetter = (pos: number, value: string) => {
    if (answered) return;
    const ch = value.replace(/[^A-Za-z]/g, "").slice(-1);
    setInputs((prev) => ({ ...prev, [pos]: ch }));
    if (ch) {
      const order = round.blanks;
      const next = order[order.indexOf(pos) + 1];
      if (next !== undefined) inputRefs.current[next]?.focus();
    }
  };

  const onKeyDown = (pos: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && allFilled) {
      handleCheck();
    } else if (e.key === "Backspace" && !(inputs[pos] ?? "")) {
      const order = round.blanks;
      const prev = order[order.indexOf(pos) - 1];
      if (prev !== undefined) inputRefs.current[prev]?.focus();
    }
  };

  // ---- Intro / idle screen ------------------------------------------------
  if (status === "idle") {
    return (
      <div className="animate-fade-in w-full max-w-xl mx-auto py-8 text-center space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2a4d69]/10 text-[#2a4d69]">
          <Puzzle className="h-7 w-7" />
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 text-balance">
            Fill in the Blanks
          </h2>
          <p className="text-sm text-slate-500 font-light leading-relaxed max-w-md mx-auto text-pretty">
            {ROUND_LENGTH} acronyms, each missing a letter or two. Use the
            description — and the full name if you&apos;re stuck — to guess what
            belongs in the blanks.
          </p>
        </div>
        <button
          onClick={startRound}
          className="rounded-lg bg-[#2a4d69] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#1d354b] transition active:scale-[0.96]"
          id="guess-start-btn"
        >
          Start Game
        </button>
      </div>
    );
  }

  // ---- Score / finished screen --------------------------------------------
  if (status === "finished") {
    const isPerfect = score === rounds.length;
    const pct = Math.round((score / rounds.length) * 100);
    const blurb =
      pct === 100
        ? "Perfect score — you really know your acronyms!"
        : pct >= 70
          ? "Nicely done. You know your way around."
          : pct >= 40
            ? "Not bad — a little more browsing and you'll have these down."
            : "Plenty more to discover in the directory.";
    return (
      <div className="animate-fade-in w-full max-w-xl mx-auto py-8 text-center space-y-6">
        {isPerfect && <Confetti />}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2a4d69]/10 text-[#2a4d69]">
          <Trophy className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <p className="font-mono text-[10.5px] font-bold text-[#2a4d69] uppercase tracking-widest">
            Round Complete
          </p>
          <h2 className="text-4xl font-black font-display tracking-tight text-slate-900 tabular-nums">
            {score} / {rounds.length}
          </h2>
          <p className="text-sm text-slate-500 font-light text-pretty">{blurb}</p>
        </div>
        <button
          onClick={startRound}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#2a4d69] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#1d354b] transition active:scale-[0.96]"
          id="guess-restart-btn"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Play Again
        </button>
      </div>
    );
  }

  // ---- Active question ----------------------------------------------------
  return (
    <div className="animate-fade-in w-full max-w-xl mx-auto py-4 space-y-6">
      {/* Progress + running score */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="font-mono text-slate-400 uppercase tracking-widest tabular-nums">
            Question {current + 1} / {rounds.length}
          </span>
          <span className="text-slate-500 tabular-nums">
            Score: <strong className="text-[#2a4d69]">{score}</strong>
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#2a4d69] transition-[width] duration-300 ease-out"
            style={{ width: `${(current / rounds.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Acronym with blanks */}
      <div className="rounded-xl border border-[#e0e0e0] bg-white p-6 text-center shadow-xs">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
          Fill in the missing letter{round.blanks.length > 1 ? "s" : ""}
        </p>
        <div className="mt-3 flex items-center justify-center gap-1.5 font-display">
          {[...round.entry.acronym].map((ch, i) => {
            if (round.blanks.includes(i)) {
              const typed = inputs[i] ?? "";
              const slotCorrect = typed.toUpperCase() === ch.toUpperCase();
              const ring = !answered
                ? "border-[#adc2d2] focus:border-[#2a4d69] focus:ring-2 focus:ring-[#2a4d69]/20"
                : slotCorrect
                  ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                  : "border-red-300 bg-red-50 text-red-700";
              return (
                <input
                  key={i}
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="text"
                  maxLength={1}
                  value={typed}
                  disabled={answered}
                  onChange={(e) => setLetter(i, e.target.value)}
                  onKeyDown={(e) => onKeyDown(i, e)}
                  aria-label={`Missing letter ${round.blanks.indexOf(i) + 1}`}
                  className={`h-14 w-12 rounded-lg border-2 text-center text-3xl font-black uppercase text-slate-900 outline-none transition ${ring}`}
                />
              );
            }
            if (ch === " ") return <span key={i} className="w-2" />;
            return (
              <span key={i} className="text-4xl font-black tracking-tight text-slate-900">
                {ch}
              </span>
            );
          })}
        </div>
        {answered && (
          <div className="mt-4 flex flex-col items-center gap-1.5">
            {isCorrect ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                <Check className="h-4 w-4" /> Correct
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-red-500">
                <X className="h-4 w-4" /> Not quite
              </span>
            )}
            <p className="text-sm font-bold text-slate-700 text-balance">
              {round.entry.acronym} — {round.entry.fullName}
            </p>
          </div>
        )}
      </div>

      {/* Hint — the description, hidden until the player asks for it. */}
      <div className="rounded-xl border border-[#adc2d2]/30 bg-slate-50/60 p-4">
        {answered || revealedHint ? (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Hint
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 font-light text-pretty">
              {round.entry.description}
            </p>
          </div>
        ) : (
          <button
            onClick={() => setRevealedHint(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2a4d69] hover:text-[#1d354b] transition active:scale-[0.96]"
            id="guess-hint-btn"
          >
            <Lightbulb className="h-3.5 w-3.5" />
            Show hint
          </button>
        )}
      </div>

      {/* Check / advance */}
      <div className="flex items-center justify-end">
        {answered ? (
          <button
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2a4d69] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#1d354b] transition active:scale-[0.96]"
            id="guess-next-btn"
          >
            {current + 1 >= rounds.length ? "See Results" : "Next"}
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            onClick={handleCheck}
            disabled={!allFilled}
            className="rounded-lg bg-[#2a4d69] px-6 py-2.5 text-xs font-bold text-white transition active:scale-[0.96] enabled:hover:bg-[#1d354b] disabled:opacity-40 disabled:cursor-not-allowed"
            id="guess-check-btn"
          >
            Check
          </button>
        )}
      </div>
    </div>
  );
}
