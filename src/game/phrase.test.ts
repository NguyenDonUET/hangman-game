import { describe, expect, it } from "vitest";
import { KEY_ROWS, letterFromKey } from "./alphabet";
import {
  deal,
  describeShape,
  isSolved,
  longestWordLength,
  openingStatus,
  speakPuzzle,
  tokenize,
} from "./phrase";
import type { Catalog, Entry } from "./types";

function entry(name: string, selected = false): Entry {
  return { name, selected };
}

function catalog(movies: Entry[]): Catalog {
  return {
    Movies: movies,
    "TV Shows": [entry("Lost")],
    Countries: [entry("Peru")],
    "Capital Cities": [entry("Oslo")],
    Animals: [entry("Fox")],
    Sports: [entry("Rugby")],
  };
}

describe("tokenize", () => {
  it("splits words, uppercases letters, and keeps punctuation visible", () => {
    expect(tokenize("Schindler's List")).toEqual([
      [
        { kind: "letter", value: "S" },
        { kind: "letter", value: "C" },
        { kind: "letter", value: "H" },
        { kind: "letter", value: "I" },
        { kind: "letter", value: "N" },
        { kind: "letter", value: "D" },
        { kind: "letter", value: "L" },
        { kind: "letter", value: "E" },
        { kind: "letter", value: "R" },
        { kind: "mark", value: "'" },
        { kind: "letter", value: "S" },
      ],
      [
        { kind: "letter", value: "L" },
        { kind: "letter", value: "I" },
        { kind: "letter", value: "S" },
        { kind: "letter", value: "T" },
      ],
    ]);
  });

  it("keeps digits and symbols visible and uppercases letters", () => {
    expect(tokenize("A1-b")).toEqual([
      [
        { kind: "letter", value: "A" },
        { kind: "mark", value: "1" },
        { kind: "mark", value: "-" },
        { kind: "letter", value: "B" },
      ],
    ]);
  });

  it("sizes tiles from the longest word, ignoring the apostrophe", () => {
    expect(longestWordLength("Schindler's List")).toBe(10);
    expect(longestWordLength("Netherlands")).toBe(11);
  });
});

describe("rules", () => {
  it("solves when every letter is guessed and punctuation is free", () => {
    const phrase = "Schindler's List";
    const guessed = new Set(["S", "C", "H", "I", "N", "D", "L", "E", "R", "T"]);
    expect(isSolved(phrase, guessed)).toBe(true);
    expect(isSolved(phrase, new Set(["S"]))).toBe(false);
  });

  it("describes the shape without naming letters", () => {
    expect(describeShape("United Kingdom")).toBe("2 words, 6 and 7 letters.");
    expect(describeShape("Peru")).toBe("1 word, 4 letters.");
    expect(openingStatus("Countries", "United Kingdom", false)).toBe(
      "Countries. 2 words, 6 and 7 letters. Guess a letter, or use the on-screen keys.",
    );
    expect(openingStatus("Movies", "Alien", true)).toContain("Starting over.");
    expect(openingStatus("Movies", "Alien", true)).not.toContain("Alien");
  });

  it("reads blanks until a loss reveals them", () => {
    expect(speakPuzzle("United Kingdom", new Set(["U", "N", "I", "D", "O"]), false)).toBe(
      "U N I blank blank D. blank I N blank D O blank",
    );
    expect(speakPuzzle("United Kingdom", new Set(["U"]), true)).toContain("K");
  });
});

describe("deal", () => {
  it("marks the dealt title selected", () => {
    const result = deal(catalog([entry("Alien"), entry("Jaws")]), "Movies", {
      random: () => 0,
    });
    expect(result.phrase).toBe("Alien");
    expect(result.recycled).toBe(false);
    expect(result.catalog.Movies.map((item) => item.selected)).toEqual([true, false]);
  });

  it("skips titles already seen this visit", () => {
    const result = deal(catalog([entry("Alien", true), entry("Jaws")]), "Movies", {
      random: () => 0,
    });
    expect(result.phrase).toBe("Jaws");
  });

  it("starts the list over without repeating the title just finished", () => {
    const result = deal(catalog([entry("Alien", true), entry("Jaws", true)]), "Movies", {
      random: () => 0,
      avoid: "Jaws",
    });
    expect(result.recycled).toBe(true);
    expect(result.phrase).toBe("Alien");
    expect(result.catalog.Movies.find((item) => item.name === "Jaws")?.selected).toBe(true);
  });

  it("can repeat the only title in a category", () => {
    const result = deal(catalog([entry("Alien", true)]), "Movies", {
      random: () => 0,
      avoid: "Alien",
    });
    expect(result.recycled).toBe(true);
    expect(result.phrase).toBe("Alien");
  });

  it("clamps a sample that is outside 0 to 1", () => {
    const titles = [entry("Alien"), entry("Jaws")];
    expect(deal(catalog(titles), "Movies", { random: () => 99 }).phrase).toBe("Jaws");
    expect(deal(catalog(titles), "Movies", { random: () => Number.NaN }).phrase).toBe("Alien");
    expect(deal(catalog(titles), "Movies", { random: () => -4 }).phrase).toBe("Alien");
  });
});

describe("alphabet", () => {
  it("is the 26 keys, and keyboard input normalizes to one of them", () => {
    const letters = KEY_ROWS.flat();
    expect(new Set(letters).size).toBe(26);
    expect(letterFromKey("q")).toBe("Q");
    expect(letterFromKey("Enter")).toBeNull();
    expect(letterFromKey("1")).toBeNull();
  });
});
