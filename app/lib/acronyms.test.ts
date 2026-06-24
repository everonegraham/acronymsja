import { describe, it, expect } from "vitest";
import { acronymsData, CATEGORY_META, type Acronym } from "./acronyms";

describe("acronymsData integrity", () => {
  it("has at least one entry", () => {
    expect(acronymsData.length).toBeGreaterThan(0);
  });

  it("every entry has the required non-empty string fields", () => {
    const required: (keyof Acronym)[] = [
      "id",
      "acronym",
      "category",
      "fullName",
      "description",
    ];
    for (const entry of acronymsData) {
      for (const field of required) {
        expect(typeof entry[field], `${entry.id}.${field}`).toBe("string");
        expect((entry[field] as string).length, `${entry.id}.${field}`).toBeGreaterThan(0);
      }
    }
  });

  it("every entry has a known category", () => {
    for (const entry of acronymsData) {
      expect(CATEGORY_META[entry.category], `${entry.id}.category=${entry.category}`).toBeDefined();
    }
  });

  it("has unique ids", () => {
    const ids = acronymsData.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has unique acronyms", () => {
    const acs = acronymsData.map((a) => a.acronym);
    expect(new Set(acs).size).toBe(acs.length);
  });
});
