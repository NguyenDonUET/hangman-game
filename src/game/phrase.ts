import { isLetter, type Letter } from "./alphabet";
import type { Catalog, CategoryName, Entry } from "./types";

export type Token =
  | { kind: "letter"; value: Letter }
  | { kind: "mark"; value: string };

export type Word = Token[];

function tokenFor(char: string): Token {
  const value = char.toUpperCase();
  if (isLetter(value)) return { kind: "letter", value };
  return { kind: "mark", value: char };
}

export function tokenize(phrase: string): Word[] {
  return phrase
    .split(" ")
    .filter((word) => word.length > 0)
    .map((word) => [...word].map(tokenFor));
}

export function lettersIn(phrase: string): Set<Letter> {
  const letters = new Set<Letter>();
  for (const char of phrase) {
    const value = char.toUpperCase();
    if (isLetter(value)) letters.add(value);
  }
  return letters;
}

export function isSolved(phrase: string, guessed: ReadonlySet<string>): boolean {
  for (const letter of lettersIn(phrase)) {
    if (!guessed.has(letter)) return false;
  }
  return true;
}

export function longestWordLength(phrase: string): number {
  return tokenize(phrase).reduce((longest, word) => {
    const count = word.filter((token) => token.kind === "letter").length;
    return Math.max(longest, count);
  }, 1);
}

export function describeShape(phrase: string): string {
  const counts = tokenize(phrase).map(
    (word) => word.filter((token) => token.kind === "letter").length,
  );
  const last = counts.at(-1);
  if (last === undefined) return "No letters.";
  if (counts.length === 1) {
    return `1 word, ${last} ${last === 1 ? "letter" : "letters"}.`;
  }
  const rest = counts.slice(0, -1).join(", ");
  return `${counts.length} words, ${rest} and ${last} letters.`;
}

export function openingStatus(
  category: string,
  phrase: string,
  recycled: boolean,
): string {
  const shape = `${describeShape(phrase)} Guess a letter, or use the on-screen keys.`;
  if (!recycled) return `${category}. ${shape}`;
  return `You've played every title in ${category}. Starting over. ${shape}`;
}

export function speakPuzzle(
  phrase: string,
  guessed: ReadonlySet<string>,
  revealMisses: boolean,
): string {
  return tokenize(phrase)
    .map((word) =>
      word
        .map((token) => {
          if (token.kind === "mark") return token.value;
          if (guessed.has(token.value) || revealMisses) return token.value;
          return "blank";
        })
        .join(" "),
    )
    .join(". ");
}

export type DealResult = {
  phrase: string;
  catalog: Catalog;
  recycled: boolean;
};

export function deal(
  catalog: Catalog,
  category: CategoryName,
  options?: { readonly random?: () => number; readonly avoid?: string },
): DealResult {
  const random = options?.random ?? Math.random;
  const avoid = options?.avoid;
  let entries: readonly Entry[] = catalog[category];
  let recycled = false;
  let pool: readonly Entry[] = entries.filter((entry) => !entry.selected);

  if (pool.length === 0) {
    recycled = true;
    entries = entries.map((entry) => ({
      ...entry,
      selected: avoid !== undefined && entry.name === avoid,
    }));
    pool = entries.filter((entry) => !entry.selected);
    if (pool.length === 0) {
      entries = entries.map((entry) => ({ ...entry, selected: false }));
      pool = entries;
    }
  }

  const sample = random();
  const ratio = Number.isFinite(sample) && sample > 0 ? sample : 0;
  const index = Math.min(pool.length - 1, Math.max(0, Math.floor(ratio * pool.length)));
  const chosen = pool.at(index);
  if (!chosen) throw new Error(`No titles in ${category}`);

  const updated = entries.map((entry) =>
    entry.name === chosen.name ? { ...entry, selected: true } : entry,
  );

  return {
    phrase: chosen.name,
    recycled,
    catalog: { ...catalog, [category]: updated },
  };
}
