import type { Metadata } from "next";
import Games from "../components/Games";

export const metadata: Metadata = {
  title: "Games",
  description:
    "Test how well you know Jamaican acronyms — play the Quiz or the Guess fill-in-the-blanks game.",
  alternates: { canonical: "/games" },
};

export default function GamesPage() {
  return <Games />;
}
