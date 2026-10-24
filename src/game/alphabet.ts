export const KEY_ROWS = [
  ["A", "B", "C", "D", "E", "F", "G", "H", "I"],
  ["J", "K", "L", "M", "N", "O", "P", "Q", "R"],
  ["S", "T", "U", "V", "W", "X", "Y", "Z"],
] as const;

export type Letter = (typeof KEY_ROWS)[number][number];

const LETTERS: ReadonlySet<string> = new Set(KEY_ROWS.flat());

export function isLetter(value: string): value is Letter {
  return LETTERS.has(value);
}

export function letterFromKey(key: string): Letter | null {
  const letter = key.toUpperCase();
  return isLetter(letter) ? letter : null;
}
