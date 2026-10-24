import type { Catalog, CategoryName } from "./types";

export type Token =
  | { kind: "letter"; value: string }
  | { kind: "mark"; value: string };

export type Word = Token[];

const LETTER = /^[A-Za-z]$/;

export function tokenize(phrase: string): Word[] {
  return phrase
    .split(" ")
    .filter((word) => word.length > 0)
    .map((word) => {
      const tokens: Token[] = [];
      for (const char of word) {
        if (LETTER.test(char)) {
          tokens.push({ kind: "letter", value: char.toUpperCase() });
        } else {
          tokens.push({ kind: "mark", value: char });
        }
      }
      return tokens;
    });
}

export function lettersIn(phrase: string): Set<string> {
  const letters = new Set<string>();
  for (const char of phrase) {
    if (LETTER.test(char)) letters.add(char.toUpperCase());
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
  if (counts.length === 0) return "No letters.";
  if (counts.length === 1) {
    return `1 word, ${counts[0]} ${counts[0] === 1 ? "letter" : "letters"}.`;
  }
  const last = counts[counts.length - 1];
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
  options?: { random?: () => number; avoid?: string },
): DealResult {
  const random = options?.random ?? Math.random;
  const avoid = options?.avoid;
  let entries = catalog[category];
  let recycled = false;
  let pool = entries.filter((entry) => !entry.selected);

  if (pool.length === 0) {
    recycled = true;
    entries = entries.map((entry) => ({
      ...entry,
      selected: avoid != null && entry.name === avoid,
    }));
    pool = entries.filter((entry) => !entry.selected);
    if (pool.length === 0) {
      entries = entries.map((entry) => ({ ...entry, selected: false }));
      pool = entries;
    }
  }

  const index = Math.min(pool.length - 1, Math.floor(random() * pool.length));
  const chosen = pool[index];
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
