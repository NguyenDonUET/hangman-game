import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("menu offers play and how to play", async ({ page }) => {
  await expect(page.getByRole("img", { name: "Hangman" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "How to Play" })).toBeVisible();
});

test("how to play lists the rules and returns to the menu", async ({ page }) => {
  await page.getByRole("button", { name: "How to Play" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "How to Play" })).toBeFocused();
  await expect(page.getByRole("listitem")).toHaveCount(3);
  await expect(page.getByRole("heading", { level: 2 })).toHaveText([
    "Choose a category",
    "Guess letters",
    "Win or lose",
  ]);

  await page.getByRole("button", { name: "Back to menu" }).click();
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
});

test("category screen lists every category and returns to the menu", async ({ page }) => {
  await page.getByRole("button", { name: "Play", exact: true }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Pick a Category" })).toBeFocused();
  await expect(page.getByRole("group", { name: "Categories" }).getByRole("button")).toHaveText([
    "Movies",
    "TV Shows",
    "Countries",
    "Capital Cities",
    "Animals",
    "Sports",
  ]);

  await page.getByRole("button", { name: "Back to menu" }).click();
  await expect(page.getByRole("button", { name: "How to Play" })).toBeVisible();
});

test("the menu is fully operable from the keyboard", async ({ page }) => {
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page.getByRole("heading", { level: 1, name: "Pick a Category" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Back to menu" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Movies" })).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page.getByRole("heading", { level: 1, name: "Movies" })).toBeFocused();
});
