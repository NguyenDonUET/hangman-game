export const CATEGORIES = [
  "Movies",
  "TV Shows",
  "Countries",
  "Capital Cities",
  "Animals",
  "Sports",
] as const;

export type CategoryName = (typeof CATEGORIES)[number];

export type Entry = {
  readonly name: string;
  readonly selected: boolean;
};

export type Catalog = {
  readonly [Key in CategoryName]: readonly Entry[];
};

export type Screen = "menu" | "howTo" | "categories" | "play";

export type Overlay = "paused" | "won" | "lost" | null;

export const MAX_LIVES = 8;

export type State = {
  screen: Screen;
  overlay: Overlay;
  category: CategoryName | null;
  phrase: string | null;
  guessed: ReadonlySet<string>;
  misses: number;
  /** Identity of the current deal. A repeated title still gets a new round. */
  round: number;
  catalog: Catalog;
  status: string;
  note: string | null;
};

export type Action =
  | { type: "show-menu" }
  | { type: "show-how-to" }
  | { type: "show-categories" }
  | { type: "start"; category: CategoryName; pick: number }
  | { type: "play-again"; pick: number }
  | { type: "guess"; letter: string }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "quit" };
