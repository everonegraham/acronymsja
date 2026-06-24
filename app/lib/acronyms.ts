import rawAcronymsData from "./acronyms.json";

export type Category = "government" | "public" | "private" | "civic" | "other";

export interface Acronym {
  id: string;
  acronym: string;
  category: Category;
  fullName: string;
  description: string;
  website?: string;
  established?: string;
}

// Display metadata for each category — label shown on badges/filters and the
// Tailwind classes used to colour them. Order here is the order filters appear.
export const CATEGORY_META: Record<
  Category,
  { label: string; badge: string }
> = {
  government: { label: "Government", badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  public: { label: "Public", badge: "bg-sky-50 text-sky-700 ring-sky-600/20" },
  private: { label: "Private", badge: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  civic: { label: "Civic", badge: "bg-violet-50 text-violet-700 ring-violet-600/20" },
  other: { label: "Other", badge: "bg-slate-100 text-slate-600 ring-slate-500/20" },
};

export const CATEGORY_ORDER = Object.keys(CATEGORY_META) as Category[];

export const acronymsData: Acronym[] = rawAcronymsData as Acronym[];
