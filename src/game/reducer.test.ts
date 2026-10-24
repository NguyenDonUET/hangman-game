import { describe, expect, it } from "vitest";
import { createInitialState, reducer } from "./reducer";
import type { Catalog, State } from "./types";
import { MAX_LIVES } from "./types";

function catalog(): Catalog {
  return {
    Movies: [
      { name: "Alien", selected: false },
      { name: "Jaws", selected: true },
    ],
    "TV Shows": [{ name: "Lost", selected: false }],
    Countries: [{ name: "Peru", selected: false }],
    "Capital Cities": [{ name: "Oslo", selected: false }],
    Animals: [{ name: "Fox", selected: false }],
    Sports: [{ name: "Rugby", selected: false }],
  };
}

function playing(overrides: Partial<State> = {}): State {
  return {
    ...createInitialState(),
    screen: "play",
    category: "Movies",
    phrase: "Alien",
    catalog: catalog(),
    ...overrides,
  };
}

describe("reducer", () => {
  it("fills a hit without spending a life", () => {
    const next = reducer(playing(), { type: "guess", letter: "a" });
    expect(next.misses).toBe(0);
    expect([...next.guessed]).toEqual(["A"]);
    expect(next.overlay).toBeNull();
    expect(next.status).toContain("A, correct");
  });

  it("ignores a repeated letter", () => {
    const once = reducer(playing(), { type: "guess", letter: "Z" });
    const twice = reducer(once, { type: "guess", letter: "Z" });
    expect(twice).toBe(once);
  });

  it("loses on the eighth miss and ignores further guesses", () => {
    let state = playing();
    for (const letter of ["B", "C", "D", "F", "G", "H", "J", "K"]) {
      state = reducer(state, { type: "guess", letter });
    }
    expect(state.misses).toBe(MAX_LIVES);
    expect(state.overlay).toBe("lost");
    expect(state.status).toBe("You lose. The answer was Alien.");
    expect(reducer(state, { type: "guess", letter: "Q" })).toBe(state);
  });

  it("wins when the last missing letter is guessed", () => {
    const state = playing({
      guessed: new Set(["A", "L", "I", "E"]),
    });
    const next = reducer(state, { type: "guess", letter: "N" });
    expect(next.overlay).toBe("won");
    expect(next.misses).toBe(0);
    expect(next.status).toBe("You win.");
  });

  it("does not guess through the pause menu", () => {
    const paused = reducer(playing(), { type: "pause" });
    expect(paused.overlay).toBe("paused");
    expect(reducer(paused, { type: "guess", letter: "A" })).toBe(paused);
    expect(reducer(paused, { type: "resume" }).overlay).toBeNull();
  });

  it("quits to the menu and keeps titles already dealt", () => {
    const next = reducer(playing(), { type: "quit" });
    expect(next.screen).toBe("menu");
    expect(next.phrase).toBeNull();
    expect(next.catalog.Movies[1]?.selected).toBe(true);
  });

  it("starts a round from a dealt phrase", () => {
    const next = reducer(createInitialState(), {
      type: "deal",
      category: "Countries",
      phrase: "Peru",
      catalog: catalog(),
      status: "Countries. 1 word, 4 letters.",
      note: null,
    });
    expect(next.screen).toBe("play");
    expect(next.phrase).toBe("Peru");
    expect(next.guessed.size).toBe(0);
    expect(next.misses).toBe(0);
  });
});
