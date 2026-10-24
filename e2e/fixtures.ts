import { test as base, expect, type Page } from "@playwright/test";
import raw from "../src/data/categories.json" with { type: "json" };

type CategoryName = keyof typeof raw.categories;

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// With Math.random pinned to 0, `deal` always picks the first unplayed title.
export function titleAt(category: CategoryName, index: number): string {
  const entry = raw.categories[category][index];
  if (!entry) throw new Error(`No title ${index} in ${category}`);
  return entry.name;
}

export function lettersOf(phrase: string): string[] {
  return [...new Set(phrase.toUpperCase().split(""))].filter((char) => ALPHABET.includes(char));
}

export function lettersNotIn(phrase: string): string[] {
  const present = new Set(lettersOf(phrase));
  return ALPHABET.filter((letter) => !present.has(letter));
}

export function key(page: Page, letter: string) {
  return page
    .getByRole("group", { name: "Letter keys" })
    .getByRole("button", { name: new RegExp(`^${letter}(, guessed)?$`) });
}

export function health(page: Page) {
  return page.getByRole("meter", { name: "Health" });
}

export function announcer(page: Page) {
  return page.locator('[aria-live="polite"]');
}

export async function guessAll(page: Page, letters: readonly string[]) {
  for (const letter of letters) {
    await key(page, letter).click();
  }
}

export async function startRound(page: Page, category: CategoryName) {
  await page.goto("/");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.getByRole("button", { name: category, exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: category })).toBeFocused();
}

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      Math.random = () => 0;
    });
    await use(page);
  },
});

export { expect };
