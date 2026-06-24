import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// Wraps an individual game page with a "back to the hub" link. Server component —
// no interactivity of its own; the game it wraps brings its own client logic.
export default function GamePageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full">
      <Link
        href="/games"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#2a4d69] transition active:scale-[0.96]"
        id="games-back-btn"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All games
      </Link>
      <div className="mt-4">{children}</div>
    </div>
  );
}
