"use client";

import { useState } from "react";
import { Brain, Puzzle, Target, ArrowLeft, ChevronRight, type LucideIcon } from "lucide-react";
import Quiz from "./Quiz";
import Guess from "./Guess";
import Daily from "./Daily";

type GameId = "quiz" | "guess" | "daily";

interface GameMeta {
  id: GameId;
  title: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
}

const GAMES: GameMeta[] = [
  {
    id: "quiz",
    title: "Quiz",
    tagline: "Multiple choice",
    description:
      "We show you a Jamaican acronym — pick what it stands for from four options. Ten questions a round.",
    icon: Brain,
  },
  {
    id: "guess",
    title: "Guess",
    tagline: "Fill in the blanks",
    description:
      "We hide a letter or two of an acronym — guess what's missing, with the description and full name as hints.",
    icon: Puzzle,
  },
  {
    id: "daily",
    title: "Daily Puzzle",
    tagline: "Hardcore",
    description:
      "One entity a day, the same for everyone. Just the clue — no letters, no blanks. Five guesses to name the acronym.",
    icon: Target,
  },
];

export default function Games() {
  const [active, setActive] = useState<GameId | null>(null);

  // ---- A selected game, with a back link to the hub -----------------------
  if (active) {
    return (
      <div className="w-full">
        <button
          onClick={() => setActive(null)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#2a4d69] transition active:scale-[0.96]"
          id="games-back-btn"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All games
        </button>
        <div className="mt-4">
          {active === "quiz" ? <Quiz /> : active === "guess" ? <Guess /> : <Daily />}
        </div>
      </div>
    );
  }

  // ---- Games hub ----------------------------------------------------------
  return (
    <div className="animate-fade-in w-full max-w-3xl mx-auto py-4 space-y-8">
      <div className="text-center space-y-3">
        <span className="inline-flex rounded-full bg-[#2a4d69]/10 px-3 py-1 text-[10.5px] font-bold text-[#2a4d69] font-mono uppercase tracking-widest">
          Games
        </span>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 text-balance">
          Play & Learn
        </h2>
        <p className="text-sm text-slate-500 font-light leading-relaxed max-w-md mx-auto text-pretty">
          Test how well you know Jamaican acronyms. Pick a game to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {GAMES.map((game) => {
          const Icon = game.icon;
          return (
            <button
              key={game.id}
              onClick={() => setActive(game.id)}
              className="group flex flex-col items-start gap-3 rounded-xl border border-[#e0e0e0] bg-white p-6 text-left transition hover:border-[#adc2d2] hover:shadow-xs active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2a4d69]/40"
              id={`game-card-${game.id}`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#2a4d69]/10 text-[#2a4d69]">
                <Icon className="h-5.5 w-5.5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{game.title}</h3>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500 font-mono">
                    {game.tagline}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-light leading-relaxed text-pretty">
                  {game.description}
                </p>
              </div>
              <span className="mt-2 inline-flex items-center gap-0.5 text-xs font-bold text-[#2a4d69] group-hover:translate-x-0.5 transition-transform">
                Play
                <ChevronRight className="h-3 w-3" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
