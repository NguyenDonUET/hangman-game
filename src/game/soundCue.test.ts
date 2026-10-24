import { describe, expect, it } from "vitest";
import { createInitialState, reducer } from "./reducer";
import { soundCue } from "./soundCue";
import type { State } from "./types";
import { MAX_LIVES } from "./types";

function playing(overrides: Partial<State> = {}): State {
  return {
    ...createInitialState(),
    screen: "play",
    category: "Movies",
    phrase: "Jaws",
    round: 1,
    ...overrides,
  };
}

describe("soundCue", () => {
  it("cues a hit for a correct guess", () => {
    const before = playing();
    expect(soundCue(before, reducer(before, { type: "guess", letter: "J" }))).toBe("hit");
  });

  it("cues a miss for a wrong guess", () => {
    const before = playing();
    expect(soundCue(before, reducer(before, { type: "guess", letter: "Z" }))).toBe("miss");
  });

  it("cues a win instead of a hit on the solving guess", () => {
    const before = playing({ guessed: new Set(["J", "A", "W"]) });
    expect(soundCue(before, reducer(before, { type: "guess", letter: "S" }))).toBe("win");
  });

  it("cues a loss instead of a miss on the last life", () => {
    const before = playing({ misses: MAX_LIVES - 1 });
    expect(soundCue(before, reducer(before, { type: "guess", letter: "Z" }))).toBe("lose");
  });

  it("stays silent for ignored guesses, pausing, and quitting", () => {
    const before = playing({ guessed: new Set(["J"]) });
    expect(soundCue(before, reducer(before, { type: "guess", letter: "J" }))).toBeNull();
    expect(soundCue(before, reducer(before, { type: "pause" }))).toBeNull();
    expect(soundCue(before, reducer(before, { type: "quit" }))).toBeNull();
  });

  it("stays silent when a new round is dealt", () => {
    const before = playing({ guessed: new Set(["J"]) });
    expect(soundCue(before, { ...before, round: 2, guessed: new Set(["J", "A"]) })).toBeNull();
  });
});
