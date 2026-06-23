"use client";

import { Puzzle } from "lucide-react";

// Placeholder for the upcoming "Guess" game — to be built out next.
export default function Guess() {
  return (
    <div className="animate-fade-in w-full max-w-xl mx-auto py-12 text-center space-y-5">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2a4d69]/10 text-[#2a4d69]">
        <Puzzle className="h-7 w-7" />
      </div>
      <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Guess</h2>
      <p className="text-sm text-slate-500 font-light leading-relaxed max-w-md mx-auto text-pretty">
        This game is coming soon.
      </p>
    </div>
  );
}
