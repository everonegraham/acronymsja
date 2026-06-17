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

export const acronymsData: Acronym[] = rawAcronymsData;

// Curated display order for the broad sector buckets. Any category that appears
// in the data but isn't listed here is appended alphabetically, so a new entry's
// category pill always shows up — the list can never drift from the data.
export const CATEGORY_ORDER = [
  "Government & Public Sector",
  "Business & Finance",
  "Education",
  "Health",
  "Security & Justice",
  "Infrastructure",
  "Culture, Sports & Entertainment",
  "Technology",
  "Other",
];

const presentCategories = Array.from(
  new Set(acronymsData.map((a) => a.category)),
);

const orderedCategories = [
  ...CATEGORY_ORDER.filter((c) => presentCategories.includes(c)),
  ...presentCategories
    .filter((c) => !CATEGORY_ORDER.includes(c))
    .sort((a, b) => a.localeCompare(b)),
];

// Derived from the data so the filter pills are always in sync with the entries.
export const CATEGORIES = ["All Categories", ...orderedCategories];
