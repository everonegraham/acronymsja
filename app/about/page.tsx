import type { Metadata } from "next";
import About from "../components/About";

export const metadata: Metadata = {
  title: "About",
  description:
    "About Acronyms JA — a simple, searchable directory of Jamaican acronyms and abbreviations with full names, established years, and descriptions.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return <About />;
}
