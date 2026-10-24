import raw from "../data/categories.json";
import { lettersIn, isSolved } from "./phrase";
import type { Catalog, State, Action } from "./types";
import { MAX_LIVES } from "./types";

const source = raw.categories as Catalog;

export function createInitialState(): State {
  return {
    screen: "menu",
    overlay: null,
    category: null,
    phrase: null,
    guessed: new Set(),
    misses: 0,
    catalog: structuredClone(source),
    status: "",
    note: null,
  };
}

function idle(state: State, screen: State["screen"]): State {
  return { ...state, screen, overlay: null, status: "", note: null };
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "show-menu":
    case "quit": {
      if (action.type === "show-menu") return idle(state, "menu");
      return {
        ...idle(state, "menu"),
        category: null,
        phrase: null,
        guessed: new Set(),
        misses: 0,
      };
    }
    case "show-how-to":
      return idle(state, "howTo");
    case "show-categories":
      return idle(state, "categories");
    case "deal":
      return {
        ...state,
        screen: "play",
        overlay: null,
        category: action.category,
        phrase: action.phrase,
        catalog: action.catalog,
        guessed: new Set(),
        misses: 0,
        status: action.status,
        note: action.note,
      };
    case "pause":
      if (state.screen !== "play" || state.overlay || !state.phrase) return state;
      return { ...state, overlay: "paused" };
    case "resume":
      if (state.overlay !== "paused") return state;
      return { ...state, overlay: null };
    case "guess": {
      if (state.screen !== "play" || state.overlay || !state.phrase) return state;
      const letter = action.letter.toUpperCase();
      if (!/^[A-Z]$/.test(letter) || state.guessed.has(letter)) return state;

      const guessed = new Set(state.guessed);
      guessed.add(letter);
      const hit = lettersIn(state.phrase).has(letter);
      const misses = hit ? state.misses : state.misses + 1;
      const solved = isSolved(state.phrase, guessed);
      const lost = misses >= MAX_LIVES;

      if (solved) {
        return {
          ...state,
          guessed,
          misses,
          overlay: "won",
          note: null,
          status: "You win.",
        };
      }
      if (lost) {
        return {
          ...state,
          guessed,
          misses,
          overlay: "lost",
          note: null,
          status: `You lose. The answer was ${state.phrase}.`,
        };
      }
      if (hit) {
        const remaining = [...lettersIn(state.phrase)].filter((item) => !guessed.has(item)).length;
        return {
          ...state,
          guessed,
          misses,
          note: null,
          status: `${letter}, correct. ${remaining} ${remaining === 1 ? "letter" : "letters"} left.`,
        };
      }
      const lives = MAX_LIVES - misses;
      return {
        ...state,
        guessed,
        misses,
        note: null,
        status: `${letter}, wrong. ${lives} ${lives === 1 ? "life" : "lives"} left.`,
      };
    }
  }
}
