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
  name: string;
  selected: boolean;
};

export type Catalog = Record<CategoryName, Entry[]>;

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
  catalog: Catalog;
  status: string;
  note: string | null;
};

export type DealAction = {
  type: "deal";
  category: CategoryName;
  phrase: string;
  catalog: Catalog;
  status: string;
  note: string | null;
};

export type Action =
  | { type: "show-menu" }
  | { type: "show-how-to" }
  | { type: "show-categories" }
  | DealAction
  | { type: "guess"; letter: string }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "quit" };
