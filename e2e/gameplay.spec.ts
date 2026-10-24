import {
  announcer,
  expect,
  guessAll,
  health,
  key,
  lettersNotIn,
  lettersOf,
  startRound,
  test,
  titleAt,
} from "./fixtures";

const FIRST = titleAt("Movies", 0);
const SECOND = titleAt("Movies", 1);

test.beforeEach(async ({ page }) => {
  await startRound(page, "Movies");
});

test("a new round starts with full health, an empty board, and an announcement", async ({ page }) => {
  await expect(health(page)).toHaveAttribute("aria-valuenow", "8");
  await expect(page.getByRole("group", { name: "Letter keys" }).getByRole("button")).toHaveCount(26);
  await expect(page.getByRole("group", { name: /^Puzzle\./ })).toHaveAttribute(
    "aria-label",
    /^Puzzle\.(?: |\.|blank)+$/,
  );
  await expect(announcer(page)).toHaveText(/^Movies\. \d+ words?, .+ letters\./);
});

test("a correct guess fills the blanks and keeps health", async ({ page }) => {
  const [hit] = lettersOf(FIRST);
  await key(page, hit!).click();

  await expect(key(page, hit!)).toBeDisabled();
  await expect(key(page, hit!)).toHaveAccessibleName(`${hit}, guessed`);
  await expect(health(page)).toHaveAttribute("aria-valuenow", "8");
  await expect(announcer(page)).toHaveText(new RegExp(`^${hit}, correct\\. \\d+ letters? left\\.$`));
  await expect(page.getByRole("group", { name: /^Puzzle\./ })).toHaveAttribute(
    "aria-label",
    new RegExp(`\\b${hit}\\b`),
  );
});

test("a wrong guess costs one life", async ({ page }) => {
  const [miss] = lettersNotIn(FIRST);
  await key(page, miss!).click();

  await expect(key(page, miss!)).toBeDisabled();
  await expect(health(page)).toHaveAttribute("aria-valuenow", "7");
  await expect(announcer(page)).toHaveText(`${miss}, wrong. 7 lives left.`);
});

test("the physical keyboard guesses letters and ignores repeats and shortcuts", async ({ page }) => {
  const [miss, other] = lettersNotIn(FIRST);

  await page.keyboard.press(miss!.toLowerCase());
  await expect(key(page, miss!)).toBeDisabled();
  await expect(health(page)).toHaveAttribute("aria-valuenow", "7");

  await page.keyboard.press(miss!.toLowerCase());
  await expect(health(page)).toHaveAttribute("aria-valuenow", "7");

  await page.keyboard.press(`Control+${other!.toLowerCase()}`);
  await expect(key(page, other!)).toBeEnabled();
  await expect(health(page)).toHaveAttribute("aria-valuenow", "7");
});

test("guessing every letter wins and play again deals a different title", async ({ page }) => {
  await guessAll(page, lettersOf(FIRST));

  const dialog = page.getByRole("dialog", { name: "You Win" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAccessibleDescription("You got it.");
  await expect(dialog.getByRole("button", { name: "Play again!" })).toBeFocused();
  await expect(announcer(page)).toHaveText("You win.");

  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: "Play again!" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("heading", { level: 1, name: "Movies" })).toBeFocused();
  await expect(health(page)).toHaveAttribute("aria-valuenow", "8");
  await expect(page.getByRole("group", { name: "Letter keys" }).getByRole("button", { disabled: true })).toHaveCount(0);

  await guessAll(page, lettersOf(SECOND));
  await expect(page.getByRole("dialog", { name: "You Win" })).toBeVisible();
});

test("eight wrong guesses loses and reveals the answer", async ({ page }) => {
  await guessAll(page, lettersNotIn(FIRST).slice(0, 8));

  const dialog = page.getByRole("dialog", { name: "You Lose" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAccessibleDescription(`The answer was ${FIRST}.`);
  await expect(health(page)).toHaveAttribute("aria-valuenow", "0");
  await expect(announcer(page)).toHaveText(`You lose. The answer was ${FIRST}.`);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
});

test.describe("pause menu", () => {
  test.beforeEach(async ({ page }) => {
    await page.getByRole("button", { name: "Pause game" }).click();
    await expect(page.getByRole("dialog", { name: "Paused" })).toBeVisible();
  });

  test("blocks guesses until the game continues", async ({ page }) => {
    const [miss] = lettersNotIn(FIRST);
    await expect(page.getByRole("button", { name: "Continue" })).toBeFocused();

    await page.keyboard.press(miss!.toLowerCase());
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(key(page, miss!)).toBeEnabled();
    await expect(health(page)).toHaveAttribute("aria-valuenow", "8");
  });

  test("escape continues the game", async ({ page }) => {
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByRole("button", { name: "Pause game" })).toBeEnabled();
  });

  test("clicking the backdrop continues the game", async ({ page }) => {
    await page.mouse.click(2, 2);
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("new category returns to the category screen", async ({ page }) => {
    await page.getByRole("button", { name: "New category" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Pick a Category" })).toBeFocused();
  });

  test("quit returns to the menu", async ({ page }) => {
    await page.getByRole("button", { name: "Quit game" }).click();
    await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});
