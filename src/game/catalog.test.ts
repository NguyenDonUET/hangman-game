import { describe, expect, it } from "vitest";
import raw from "../data/categories.json";
import { parseCatalog } from "./catalog";
import { CATEGORIES, type CategoryName } from "./types";

function titled(name: string, selected = false) {
  return { name, selected };
}

function withCategories(categories: Partial<Record<CategoryName, unknown>>) {
  return {
    categories: Object.fromEntries(
      CATEGORIES.map((category) => [category, categories[category] ?? [titled(`${category} one`)]]),
    ),
  };
}

describe("parseCatalog", () => {
  it("accepts the bundled category file", () => {
    const catalog = parseCatalog(raw);
    for (const category of CATEGORIES) {
      expect(catalog[category].length).toBeGreaterThan(0);
      const names = catalog[category].map((entry) => entry.name);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it("rejects a catalog that is not the expected shape", () => {
    expect(() => parseCatalog(null)).toThrow(/categories/);
    expect(() => parseCatalog({})).toThrow(/categories/);
    expect(() => parseCatalog({ categories: [] })).toThrow(/categories/);
  });

  it("rejects unknown categories, empty lists, blank names, and duplicates", () => {
    expect(() => parseCatalog({ categories: { Movies: [titled("Alien")], Extra: [] } })).toThrow(
      /Unknown category/,
    );
    expect(() => parseCatalog(withCategories({ Movies: [] }))).toThrow(/Movies/);
    expect(() => parseCatalog(withCategories({ Movies: [titled("  ")] }))).toThrow(/name/);
    expect(() => parseCatalog(withCategories({ Movies: [{ name: "Alien", selected: "no" }] }))).toThrow(
      /selected/,
    );
    expect(() =>
      parseCatalog(withCategories({ Animals: [titled("Fox"), titled("Fox")] })),
    ).toThrow(/Duplicate title "Fox"/);
  });
});
