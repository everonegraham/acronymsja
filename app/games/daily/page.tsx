import type { Metadata } from "next";
import Daily from "../../components/Daily";
import GamePageShell from "../../components/GamePageShell";

export const metadata: Metadata = {
  title: "Daily Puzzle",
  description:
    "The hardcore daily puzzle — one Jamaican entity a day, the same for everyone. Just the clue, no letters or blanks. Three guesses to name the acronym.",
  alternates: { canonical: "/games/daily" },
};

export default function DailyPage() {
  return (
    <GamePageShell>
      <Daily />
    </GamePageShell>
  );
}
