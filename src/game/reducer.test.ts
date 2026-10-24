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
    expect(next.category).toBeNull();
    expect(next.catalog.Movies[1]?.selected).toBe(true);
  });

  it("clears a round when backing out to the menu", () => {
    const next = reducer(playing(), { type: "show-menu" });
    expect(next.screen).toBe("menu");
    expect(next.phrase).toBeNull();
    expect(next.guessed.size).toBe(0);
    expect(next.catalog.Movies[1]?.selected).toBe(true);
  });

  it("starts a round only from the category screen", () => {
    const menu = createInitialState();
    expect(reducer(menu, { type: "start", category: "Countries", pick: 0 })).toBe(menu);

    const next = reducer(
      { ...createInitialState(), screen: "categories", catalog: catalog() },
      { type: "start", category: "Countries", pick: 0 },
    );
    expect(next.screen).toBe("play");
    expect(next.phrase).toBe("Peru");
    expect(next.round).toBe(1);
    expect(next.guessed.size).toBe(0);
    expect(next.misses).toBe(0);
    expect(next.note).toBeNull();
    expect(next.status).toBe(
      "Countries. 1 word, 4 letters. Guess a letter, or use the on-screen keys.",
    );
    expect(next.catalog.Countries[0]?.selected).toBe(true);
  });

  it("plays again only after a win or loss, and chains the catalog", () => {
    const state = playing();
    expect(reducer(state, { type: "play-again", pick: 0 })).toBe(state);

    const again = reducer(
      {
        ...state,
        overlay: "won",
        catalog: {
          ...catalog(),
          Movies: [
            { name: "Alien", selected: true },
            { name: "Jaws", selected: false },
          ],
        },
      },
      { type: "play-again", pick: 0 },
    );
    expect(again.phrase).toBe("Jaws");
    expect(again.overlay).toBeNull();
    expect(again.round).toBe(state.round + 1);
    expect(again.guessed.size).toBe(0);
    expect(again.catalog.Movies.map((item) => item.selected)).toEqual([true, true]);
  });

  it("starts the category over when every title has been played", () => {
    const started = reducer(
      { ...createInitialState(), screen: "categories", catalog: catalog() },
      { type: "start", category: "Countries", pick: 0 },
    );
    const again = reducer({ ...started, overlay: "lost" }, { type: "play-again", pick: 0 });
    expect(again.phrase).toBe("Peru");
    expect(again.round).toBe(started.round + 1);
    expect(again.note).toBe("Every Countries title has been played. Starting over.");
    expect(again.status).toContain("Starting over.");
    expect(again.status).not.toContain("Peru");
  });

  it("ignores keys that are not letters", () => {
    const state = playing();
    expect(reducer(state, { type: "guess", letter: "!" })).toBe(state);
    expect(reducer(state, { type: "guess", letter: "Enter" })).toBe(state);
  });

  it("gives each visit its own catalog", () => {
    const first = createInitialState();
    const title = first.catalog.Movies[0];
    expect(title).toBeDefined();
    if (!title) return;
    Reflect.set(title, "selected", true);
    expect(createInitialState().catalog.Movies[0]?.selected).toBe(false);
  });
});
