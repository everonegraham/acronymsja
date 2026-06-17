import rawAcronymsData from "./acronyms.json";

export interface Acronym {
  id: string;
  acronym: string;
  fullName: string;
  description: string;
  category: string;
  website?: string;
  established?: string;
}

export const CATEGORIES = [
  "All Categories",
  "Ministries & Offices",
  "Finance & Trade",
  "Security & Justice",
  "Infrastructure & Utilities",
  "Education & Social Services",
];

export const acronymsData: Acronym[] = rawAcronymsData;
