"use client";

import { useState, useCallback } from "react";
import { acronymsData } from "../lib/acronyms";
import type { Acronym } from "../lib/acronyms";
import Confetti from "./Confetti";
import {
  Brain,
  Check,
  X,
  ChevronRight,
  RotateCcw,
  Trophy,
} from "lucide-react";

const ROUND_LENGTH = 10;
const OPTIONS_PER_QUESTION = 4;

interface Option {
  key: string;
  label: string;
  correct: boolean;
}

interface Question {
  acronym: string;
  fullName: string; // the correct answer
  description: string;
  options: Option[];
}

// Fisher–Yates shuffle — returns a new array, leaves the input untouched.
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Grammatical glue that doesn't always contribute a letter to an acronym
// ("Ministry of Health and Wellness" → MOHW keeps "of" but drops "and"). We
// don't keep a hand-maintained stopword list: in a title-cased name the glue
// words are exactly the lowercase ones (of, the, and, or, through …), while
// every content word is capitalised — so the data tells them apart for free, and
// new entries need no list upkeep. (The acronyms mirror this too: "OoC" = Office
// of Cabinet, where the lowercase "o" is the glue word "of".)

interface Token {
  orig: string; // the word exactly as written, punctuation included ("Composers,")
  raw: string; // surrounding punctuation trimmed ("Teachers'" → "Teachers")
  norm: string; // lowercase alphanumerics, for comparison
}

const normalize = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, "");
const trimPunct = (w: string) => w.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, "");

// Split a full name into comparable tokens, dropping empties. `orig` is kept so a
// generated option can preserve the answer's exact punctuation (commas, etc.) —
// otherwise the comma'd answer would stand out from comma-less distractors.
function splitWords(name: string): Token[] {
  return name
    .split(/\s+/)
    .map((r) => ({ orig: r, raw: trimPunct(r), norm: normalize(r) }))
    .filter((t) => t.norm);
}

const wordKey = (tokens: Token[]) => tokens.map((t) => t.norm).join(" ");

// Glue words derived from the data: any word that ever appears with a lowercase
// leading letter (of, the, and, or, through …). A set rather than a per-token
// casing test, so it also catches a title-leading "The" ("The University of the
// West Indies") — capitalised there, but still glue. Never swapped out, so a
// generated option keeps the answer's skeleton.
const GLUE_WORDS = new Set<string>();
for (const a of acronymsData) {
  for (const raw of a.fullName.split(/\s+/)) {
    const w = trimPunct(raw);
    if (w && /^[a-z]/.test(w)) GLUE_WORDS.add(normalize(w));
  }
}
const isGlue = (t: Token) => GLUE_WORDS.has(t.norm);

// An embedded acronym such as "JMMB" or "WADA" — excluded from the swap
// vocabulary so options don't read like "Bank of JMMB".
const isAcronymWord = (t: Token) => t.raw.length > 1 && t.raw === t.raw.toUpperCase();

// Letters of an acronym only (drops spaces/punctuation, e.g. "JN Group").
function letters(acronym: string): string {
  return acronym.toUpperCase().replace(/[^A-Z]/g, "");
}

// ---------------------------------------------------------------------------
// Module-level vocabulary, built once from the directory.
// ---------------------------------------------------------------------------

// Every distinct real full name (normalized) — so a generated distractor that
// accidentally spells out a real organisation can be rejected.
const REAL_NAME_KEYS = new Set(acronymsData.map((a) => wordKey(splitWords(a.fullName))));

// Real content words grouped by their first letter. Replacing a word with
// another from the same letter-bucket keeps the option spelling the acronym.
const VOCAB_BY_LETTER: Record<string, Token[]> = {};
{
  const seen = new Set<string>();
  for (const a of acronymsData) {
    for (const t of splitWords(a.fullName)) {
      if (isGlue(t) || isAcronymWord(t) || t.raw.length < 3) continue;
      const letter = t.raw[0]?.toUpperCase();
      if (!letter) continue;
      const dedupe = `${letter}|${t.norm}`;
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);
      (VOCAB_BY_LETTER[letter] ??= []).push(t);
    }
  }
}

interface AlignedToken extends Token {
  clen: number; // how many leading acronym letters this word spells (0 = none)
}

// Work out which words spell the acronym, left to right: each word greedily
// consumes as many of the next acronym letters as match its own leading letters.
// Usually that's one letter ("Health" → H), but it lets a word supply several
// ("Company" → "Co" in TPDCo, "Jamaica" → "Jam" in JAMPRO). Words that match
// nothing (skipped glue, backronym filler) get clen 0. Returns the tagged words
// if every acronym letter was matched, else null (e.g. SPARK, whose K comes from
// the *end* of "Network") — those fall back to real lookalikes.
function alignToAcronym(target: Acronym): AlignedToken[] | null {
  const acro = letters(target.acronym);
  const tokens: AlignedToken[] = splitWords(target.fullName).map((t) => ({
    ...t,
    clen: 0,
  }));
  let p = 0;
  for (const t of tokens) {
    const upper = t.raw.toUpperCase();
    let k = 0;
    while (p + k < acro.length && k < upper.length && acro[p + k] === upper[k]) k++;
    if (k > 0) {
      t.clen = k;
      p += k;
    }
  }
  return p === acro.length ? tokens : null;
}

// Length of the shared leading run of two strings — used to reject near-duplicate
// swaps like "Jamaica"/"Jamaicans" or "Ministry"/"Minister" that read as typos.
function commonPrefix(a: string, b: string): number {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

// Generate up to `n` distractors that keep the answer's exact structure but swap
// a letter-bearing word for another real word starting with the same letter — so
// every option still spells the acronym and reads like a sibling of the answer.
// We rotate which word is swapped across options (round-robin over the slots), so
// the choices differ in different positions instead of all in the same one.
function generateDistractors(target: Acronym, n: number): string[] {
  const tokens = alignToAcronym(target);
  if (!tokens) return [];

  const correctKey = wordKey(tokens);
  // Swappable slots: the letter-bearing content words.
  const slots = tokens
    .map((t, i) => ({ t, i }))
    .filter((s) => s.t.clen > 0 && !isGlue(s.t));
  if (!slots.length) return [];

  const out: string[] = [];
  const usedKeys = new Set<string>();

  // Swap one word, returning the new name — or null if the replacement doesn't
  // spell the same letter(s), is the same/near-duplicate word, repeats a word
  // already in the name, or reproduces the answer or a real organisation.
  const trySwap = (slotIndex: number, repl: Token): string | null => {
    const original = tokens[slotIndex];
    // The replacement must start with the exact letters this slot spells (just
    // the first letter normally, but "Co"/"Jam" for multi-letter slots), so the
    // option still spells the acronym.
    const prefix = original.raw.slice(0, original.clen).toUpperCase();
    if (!repl.raw.toUpperCase().startsWith(prefix)) return null;
    if (repl.norm === original.norm || commonPrefix(repl.norm, original.norm) >= 5) {
      return null;
    }
    if (tokens.some((t, idx) => idx !== slotIndex && t.norm === repl.norm)) return null;
    // Rebuild from each word's original form (punctuation intact); only the
    // swapped slot changes, keeping its surrounding punctuation ("Composers," →
    // "Composers," stays, "Authors" → "Animals").
    const o = original.orig;
    const lead = o.match(/^[^A-Za-z0-9]+/)?.[0] ?? "";
    const trail = o.match(/[^A-Za-z0-9]+$/)?.[0] ?? "";
    const words = tokens.map((t) => t.orig);
    words[slotIndex] = lead + repl.raw + trail;
    const name = words.join(" ");
    const key = wordKey(splitWords(name));
    if (key === correctKey || REAL_NAME_KEYS.has(key) || usedKeys.has(key)) return null;
    usedKeys.add(key);
    return name;
  };

  // Several round-robin passes; each pass swaps one fresh word per slot, so the
  // first few distractors each change a different position.
  const order = shuffle(slots);
  for (let pass = 0; pass < 12 && out.length < n; pass++) {
    for (const slot of order) {
      if (out.length >= n) break;
      const pool = shuffle(VOCAB_BY_LETTER[slot.t.raw[0].toUpperCase()] ?? []);
      for (const repl of pool) {
        const name = trySwap(slot.i, repl);
        if (name) {
          out.push(name);
          break;
        }
      }
    }
  }
  return out;
}

// Fallback for names that can't be aligned to their acronym: real entries whose
// acronym most resembles the target's (same first letter, same length, shared
// letters). Keeps all four options convincingly alike even without generation.
function sharedLetters(a: string, b: string): number {
  const remaining = b.split("");
  let count = 0;
  for (const ch of a) {
    const i = remaining.indexOf(ch);
    if (i !== -1) {
      remaining.splice(i, 1);
      count++;
    }
  }
  return count;
}

function acronymSimilarity(a: string, b: string): number {
  const A = letters(a);
  const B = letters(b);
  let score = sharedLetters(A, B);
  if (A[0] === B[0]) score += 3;
  if (A.length === B.length) score += 2;
  return score;
}

function lookalikeDistractors(target: Acronym, n: number): string[] {
  return shuffle(acronymsData.filter((a) => a.id !== target.id))
    .map((a) => ({ a, score: acronymSimilarity(target.acronym, a.acronym) }))
    .sort((x, y) => y.score - x.score)
    .slice(0, n)
    .map((s) => s.a.fullName);
}

// Build a fresh round: pick `count` distinct acronyms as targets, and for each
// assemble four options — the real answer plus three same-acronym distractors
// (generated where possible, real lookalikes otherwise) — shuffled so the answer
// isn't always first.
function buildRound(pool: Acronym[], count: number): Question[] {
  const targets = shuffle(pool).slice(0, Math.min(count, pool.length));
  return targets.map((target) => {
    const need = OPTIONS_PER_QUESTION - 1;
    const seen = new Set([wordKey(splitWords(target.fullName))]);
    const distractors: string[] = [];

    // Prefer generated (acronym-preserving) distractors, then fill from real
    // lookalikes — deduping by normalized name so options never repeat.
    for (const name of [
      ...generateDistractors(target, need),
      ...lookalikeDistractors(target, need * 2),
    ]) {
      if (distractors.length >= need) break;
      const key = wordKey(splitWords(name));
      if (seen.has(key)) continue;
      seen.add(key);
      distractors.push(name);
    }

    const options: Option[] = shuffle([
      { key: "correct", label: target.fullName, correct: true },
      ...distractors.map((label, i) => ({ key: `d${i}`, label, correct: false })),
    ]);

    return {
      acronym: target.acronym,
      fullName: target.fullName,
      description: target.description,
      options,
    };
  });
}

type Status = "idle" | "playing" | "finished";

export default function Quiz() {
  const [status, setStatus] = useState<Status>("idle");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  // Questions are generated here (in an event handler, never during render) so
  // the random picks can't cause an SSR/client hydration mismatch.
  const startRound = useCallback(() => {
    setQuestions(buildRound(acronymsData, ROUND_LENGTH));
    setCurrent(0);
    setSelectedKey(null);
    setScore(0);
    setStatus("playing");
  }, []);

  const question = questions[current];
  const answered = selectedKey !== null;

  const handleAnswer = (option: Option) => {
    if (answered) return; // lock the answer once chosen
    setSelectedKey(option.key);
    if (option.correct) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setStatus("finished");
      return;
    }
    setCurrent((c) => c + 1);
    setSelectedKey(null);
  };

  // ---- Intro / idle screen ------------------------------------------------
  if (status === "idle") {
    return (
      <div className="animate-fade-in w-full max-w-xl mx-auto py-8 text-center space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2a4d69]/10 text-[#2a4d69]">
          <Brain className="h-7 w-7" />
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 text-balance">
            Test Your Knowledge
          </h2>
          <p className="text-sm text-slate-500 font-light leading-relaxed max-w-md mx-auto text-pretty">
            {ROUND_LENGTH} multiple-choice questions. We&apos;ll show you a Jamaican
            acronym — you pick what it stands for. See how many you can get right.
          </p>
        </div>
        <button
          onClick={startRound}
          className="rounded-lg bg-[#2a4d69] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#1d354b] transition active:scale-[0.96]"
          id="quiz-start-btn"
        >
          Start Quiz
        </button>
      </div>
    );
  }

  // ---- Score / finished screen --------------------------------------------
  if (status === "finished") {
    const isPerfect = score === questions.length;
    const pct = Math.round((score / questions.length) * 100);
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
            {score} / {questions.length}
          </h2>
          <p className="text-sm text-slate-500 font-light text-pretty">{blurb}</p>
        </div>
        <button
          onClick={startRound}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#2a4d69] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#1d354b] transition active:scale-[0.96]"
          id="quiz-restart-btn"
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
            Question {current + 1} / {questions.length}
          </span>
          <span className="text-slate-500 tabular-nums">
            Score: <strong className="text-[#2a4d69]">{score}</strong>
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#2a4d69] transition-[width] duration-300 ease-out"
            style={{ width: `${(current / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Prompt */}
      <div className="rounded-xl border border-[#e0e0e0] bg-white p-6 text-center shadow-xs">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
          What does this stand for?
        </p>
        <p className="mt-2 text-4xl font-black font-display tracking-tight text-slate-900">
          {question.acronym}
        </p>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-3" id="quiz-options">
        {question.options.map((option) => {
          const isPicked = option.key === selectedKey;

          // Default until answered; then the right answer always turns green and
          // a wrong pick turns red. Untouched options dim slightly.
          let state =
            "border-[#e0e0e0] bg-white hover:border-[#adc2d2] hover:shadow-xs";
          if (answered) {
            if (option.correct)
              state = "border-emerald-400 bg-emerald-50 text-emerald-900";
            else if (isPicked) state = "border-red-300 bg-red-50 text-red-900";
            else state = "border-[#e0e0e0] bg-white opacity-60";
          }

          return (
            <button
              key={option.key}
              onClick={() => handleAnswer(option)}
              disabled={answered}
              className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left text-sm font-medium text-slate-700 transition active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2a4d69]/40 disabled:cursor-default ${state}`}
            >
              <span className="text-pretty">{option.label}</span>
              {answered && option.correct && (
                <Check className="h-4 w-4 shrink-0 text-emerald-600" />
              )}
              {answered && isPicked && !option.correct && (
                <X className="h-4 w-4 shrink-0 text-red-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Reveal + advance */}
      {answered && (
        <div className="animate-fade-in space-y-4">
          <div className="rounded-xl border border-[#adc2d2]/30 bg-slate-50/60 p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              {question.acronym} — {question.fullName}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 font-light line-clamp-4 text-pretty">
              {question.description}
            </p>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#2a4d69] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#1d354b] transition active:scale-[0.96]"
              id="quiz-next-btn"
            >
              {current + 1 >= questions.length ? "See Results" : "Next"}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
