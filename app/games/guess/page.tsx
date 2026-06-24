import type { Metadata } from "next";
import Guess from "../../components/Guess";
import GamePageShell from "../../components/GamePageShell";

export const metadata: Metadata = {
  title: "Guess",
  description:
    "Fill-in-the-blanks game on Jamaican acronyms — we hide a letter or two, you guess what's missing, with the description and full name as hints.",
  alternates: { canonical: "/games/guess" },
};

export default function GuessPage() {
  return (
    <GamePageShell>
      <Guess />
    </GamePageShell>
  );
}
