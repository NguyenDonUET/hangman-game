import raw from "../data/categories.json";
import { letterFromKey } from "./alphabet";
import { parseCatalog } from "./catalog";
import { deal, isSolved, lettersIn, openingStatus } from "./phrase";
import { MAX_LIVES, type Action, type Catalog, type CategoryName, type State } from "./types";

let source: Catalog | null = null;

function sourceCatalog(): Catalog {
  source ??= parseCatalog(raw);
  return source;
}

export function createInitialState(): State {
  return {
    screen: "menu",
    overlay: null,
    category: null,
    phrase: null,
    guessed: new Set(),
    misses: 0,
    round: 0,
    catalog: structuredClone(sourceCatalog()),
    status: "",
    note: null,
  };
}

function atMenu(state: State): State {
  return {
    ...state,
    screen: "menu",
    overlay: null,
    category: null,
    phrase: null,
    guessed: new Set(),
    misses: 0,
    status: "",
    note: null,
  };
}

function idle(state: State, screen: State["screen"]): State {
  return { ...state, screen, overlay: null, status: "", note: null };
}

function countLabel(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function beginRound(state: State, category: CategoryName, avoid: string | null, pick: number): State {
  const random = () => pick;
  const result = deal(
    state.catalog,
    category,
    avoid === null ? { random } : { random, avoid },
  );
  return {
    ...state,
    screen: "play",
    overlay: null,
    category,
    phrase: result.phrase,
    catalog: result.catalog,
    guessed: new Set(),
    misses: 0,
    round: state.round + 1,
    status: openingStatus(category, result.phrase, result.recycled),
    note: result.recycled ? `Every ${category} title has been played. Starting over.` : null,
  };
}

function assertNever(action: never): never {
  throw new Error(`Unexpected action: ${JSON.stringify(action)}`);
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "show-menu":
    case "quit":
      return atMenu(state);
    case "show-how-to":
      return idle(state, "howTo");
    case "show-categories":
      return idle(state, "categories");
    case "start": {
      if (state.screen !== "categories") return state;
      return beginRound(state, action.category, null, action.pick);
    }
    case "play-again": {
      if ((state.overlay !== "won" && state.overlay !== "lost") || !state.category || !state.phrase) {
        return state;
      }
      return beginRound(state, state.category, state.phrase, action.pick);
    }
    case "pause":
      if (state.screen !== "play" || state.overlay || !state.phrase) return state;
      return { ...state, overlay: "paused" };
    case "resume":
      if (state.overlay !== "paused") return state;
      return { ...state, overlay: null };
    case "guess": {
      if (state.screen !== "play" || state.overlay || !state.phrase) return state;
      const letter = letterFromKey(action.letter);
      if (!letter || state.guessed.has(letter)) return state;

      const guessed = new Set(state.guessed);
      guessed.add(letter);
      const hit = lettersIn(state.phrase).has(letter);
      const misses = hit ? state.misses : state.misses + 1;
      const solved = isSolved(state.phrase, guessed);
      const lost = misses >= MAX_LIVES;

      if (solved) {
        return { ...state, guessed, misses, overlay: "won", note: null, status: "You win." };
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
          status: `${letter}, correct. ${countLabel(remaining, "letter", "letters")} left.`,
        };
      }
      const lives = MAX_LIVES - misses;
      return {
        ...state,
        guessed,
        misses,
        note: null,
        status: `${letter}, wrong. ${countLabel(lives, "life", "lives")} left.`,
      };
    }
    default:
      return assertNever(action);
  }
}
