import type { Metadata } from "next";
import Quiz from "../../components/Quiz";
import GamePageShell from "../../components/GamePageShell";

export const metadata: Metadata = {
  title: "Quiz",
  description:
    "Multiple-choice quiz on Jamaican acronyms — we show an acronym, you pick what it stands for. Ten questions a round.",
  alternates: { canonical: "/games/quiz" },
};

export default function QuizPage() {
  return (
    <GamePageShell>
      <Quiz />
    </GamePageShell>
  );
}
