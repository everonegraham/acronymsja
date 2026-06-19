import rawAcronymsData from "./acronyms.json";

export interface Acronym {
  id: string;
  acronym: string;
  fullName: string;
  description: string;
  website?: string;
  established?: string;
}

export const acronymsData: Acronym[] = rawAcronymsData;
