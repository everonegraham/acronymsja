import { describe, it, expect } from "vitest";
import { acronymsData, CATEGORIES, CATEGORY_ORDER, type Acronym } from "./acronyms";

describe("acronymsData integrity", () => {
  it("has at least one entry", () => {
    expect(acronymsData.length).toBeGreaterThan(0);
  });

  it("every entry has the required non-empty string fields", () => {
    const required: (keyof Acronym)[] = [
      "id",
      "acronym",
      "fullName",
      "description",
      "category",
    ];
    for (const entry of acronymsData) {
      for (const field of required) {
        expect(typeof entry[field], `${entry.id}.${field}`).toBe("string");
        expect((entry[field] as string).length, `${entry.id}.${field}`).toBeGreaterThan(0);
      }
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

  it("only uses categories defined in CATEGORY_ORDER", () => {
    const allowed = new Set(CATEGORY_ORDER);
    const bad = acronymsData.filter((a) => !allowed.has(a.category));
    expect(bad.map((a) => `${a.id}:${a.category}`)).toEqual([]);
  });
});

describe("CATEGORIES derivation", () => {
  it("starts with 'All Categories'", () => {
    expect(CATEGORIES[0]).toBe("All Categories");
  });

  it("has no duplicates", () => {
    expect(new Set(CATEGORIES).size).toBe(CATEGORIES.length);
  });

  it("only lists categories that are present in the data (besides 'All Categories')", () => {
    const present = new Set(acronymsData.map((a) => a.category));
    for (const cat of CATEGORIES.slice(1)) {
      expect(present.has(cat), `pill "${cat}" has no entries`).toBe(true);
    }
  });

  it("lists every category that is present in the data", () => {
    const present = [...new Set(acronymsData.map((a) => a.category))];
    for (const cat of present) {
      expect(CATEGORIES, `"${cat}" present in data but missing from pills`).toContain(cat);
    }
  });

  it("orders known categories by CATEGORY_ORDER", () => {
    const known = CATEGORIES.filter((c) => CATEGORY_ORDER.includes(c));
    const expected = CATEGORY_ORDER.filter((c) => known.includes(c));
    expect(known).toEqual(expected);
  });
});
