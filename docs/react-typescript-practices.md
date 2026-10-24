# React and TypeScript practices

This is a Vite SPA. The practices below are the ones that fit that shape. Server waterfalls, request memoization, and client data libraries are for a different architecture, so they are not used here.

## State is a pure transition

`useReducer` owns the screen, the round, and the catalog. Components dispatch actions. They do not assemble the next catalog themselves.

```tsx
// src/App.tsx
const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

<CategoryScreen
  onChoose={(category) => dispatch({ type: "start", category, pick: Math.random() })}
/>

<GameDialog
  onPlayAgain={() => dispatch({ type: "play-again", pick: Math.random() })}
/>
```

`start` and `play-again` carry a `pick` number from `Math.random()`, sampled in the click handler. `deal` then runs inside the reducer. React Strict Mode invokes reducers twice in development and keeps one result. Because the sample is already on the action, both invocations deal the same title. A second `play-again` in the same turn also sees the catalog the first dispatch just produced, so two quick deals cannot both be computed from a stale list.

```ts
// src/game/types.ts
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
```

```ts
// src/game/reducer.ts
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
```

Guesses, pause, resume, and starting a round are ignored unless the screen is already in the state that offers that action. Returning to the menu clears the phrase, the guess set, and the overlay, and it keeps the catalog, including titles already marked seen.

```ts
// src/game/reducer.ts
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
case "guess": {
  if (state.screen !== "play" || state.overlay || !state.phrase) return state;
  const letter = letterFromKey(action.letter);
  if (!letter || state.guessed.has(letter)) return state;

  const guessed = new Set(state.guessed);
  guessed.add(letter);
  // ...
}
```

```ts
// src/game/reducer.ts
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
```

`assertNever` in the `default` arm makes a new action a compile error until the switch handles it.

```ts
// src/game/reducer.ts
function assertNever(action: never): never {
  throw new Error(`Unexpected action: ${JSON.stringify(action)}`);
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    // ...
    default:
      return assertNever(action);
  }
}
```

## The JSON file is parsed, not asserted

`categories.json` is `unknown` at the boundary. `parseCatalog` checks every category name, rejects blanks and duplicates, and requires `selected` to be a boolean.

```ts
// src/game/catalog.ts
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseEntry(value: unknown, category: CategoryName): Entry {
  if (!isRecord(value)) throw new Error(`A ${category} title must be an object.`);

  const { name, selected } = value;
  if (typeof name !== "string" || name.trim() === "") {
    throw new Error(`A ${category} title needs a name.`);
  }
  if (typeof selected !== "boolean") {
    throw new Error(`"${name}" in ${category} needs a selected flag.`);
  }
  return { name, selected };
}
```

`createInitialState` clones that result with `structuredClone`. Strict Mode runs the initializer twice; each call gets its own catalog, and a mutated round cannot leak back into the next visit.

```ts
// src/game/reducer.ts
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
```

`Entry` fields are readonly. Updates copy the entry. The guess set is a `ReadonlySet`, replaced with `new Set` on each guess.

```ts
// src/game/types.ts
export type Entry = {
  readonly name: string;
  readonly selected: boolean;
};

export type Catalog = {
  readonly [Key in CategoryName]: readonly Entry[];
};

export type State = {
  // ...
  guessed: ReadonlySet<string>;
  catalog: Catalog;
};
```

```ts
// src/game/phrase.ts
const updated = entries.map((entry) =>
  entry.name === chosen.name ? { ...entry, selected: true } : entry,
);

return {
  phrase: chosen.name,
  recycled,
  catalog: { ...catalog, [category]: updated },
};
```

## One alphabet

`KEY_ROWS` is the keyboard and the source of the `Letter` union. `letterFromKey` is the only normalization path: the window listener and the reducer both use it.

```ts
// src/game/alphabet.ts
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
```

Phrase tokenization uses the same check, so a character that cannot be guessed becomes a visible mark (apostrophes, digits, hyphens) instead of a blank tile.

```ts
// src/game/phrase.ts
export type Token =
  | { kind: "letter"; value: Letter }
  | { kind: "mark"; value: string };

function tokenFor(char: string): Token {
  const value = char.toUpperCase();
  if (isLetter(value)) return { kind: "letter", value };
  return { kind: "mark", value: char };
}
```

## Render derives, effects subscribe

Lives, tokens, the spoken puzzle, and win/loss copy are computed during render. Nothing mirrors those values into state with an effect.

```tsx
// src/components/PlayScreen.tsx
const headingRef = useFocusHeading<HTMLHeadingElement>(round);
const lives = MAX_LIVES - misses;
const words = tokenize(phrase);
const revealMisses = overlay === "lost";
const puzzle = speakPuzzle(phrase, guessed, revealMisses);
```

The letter listener is attached only while a round is on screen and no dialog is open. It ignores repeats and modifier chords, and it calls `preventDefault` for a real guess, so it is not a passive listener. `dispatch` from `useReducer` is stable, and the effect re-subscribes only when the screen or the overlay changes.

```tsx
// src/App.tsx
useEffect(() => {
  if (state.screen !== "play" || state.overlay) return;

  function onKey(event: KeyboardEvent) {
    if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
    const letter = letterFromKey(event.key);
    if (!letter) return;
    event.preventDefault();
    dispatch({ type: "guess", letter });
  }

  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [state.screen, state.overlay]);
```

Dialogs use the native `<dialog>` element. `useId` labels the title and, after a win or loss, the answer. The component focuses its primary button after `showModal()`. App sets `key` to the overlay mode, so Pause and the result dialog are different instances and the mount effect runs once for each. Escape resumes a paused game and does nothing on a finished game, so a result cannot be dismissed without a choice.

```tsx
// src/App.tsx
{state.overlay ? (
  <GameDialog
    key={state.overlay}
    mode={state.overlay}
    phrase={state.phrase}
    onResume={() => dispatch({ type: "resume" })}
    onPlayAgain={() => dispatch({ type: "play-again", pick: Math.random() })}
  />
) : null}
```

```tsx
// src/components/GameDialog.tsx
const titleId = useId();
const detailId = useId();

useEffect(() => {
  const dialog = dialogRef.current;
  if (!dialog) return;
  if (!dialog.open) dialog.showModal();
  primaryRef.current?.focus();
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  return () => {
    document.body.style.overflow = previousOverflow;
    if (dialog.open) dialog.close();
  };
}, []);

<dialog
  ref={dialogRef}
  aria-labelledby={titleId}
  aria-describedby={answered ? detailId : undefined}
  onCancel={(event) => {
    event.preventDefault();
    if (mode === "paused") onResume();
  }}
>
  <TextButton ref={primaryRef} variant="pink" onClick={onResume}>
    Continue
  </TextButton>
</dialog>
```

`round` increments on every deal. The play heading focuses from that number, and the board is keyed by it. Playing the only title in a category twice still moves focus and remounts the tiles. Word and letter keys can stay index-based inside one round because that board is thrown away when the round changes.

```ts
// src/components/useFocusHeading.ts
export function useFocusHeading<T extends HTMLElement>(key: string | number) {
  const ref = useRef<T>(null);

  useEffect(() => {
    ref.current?.focus();
  }, [key]);

  return ref;
}
```

```tsx
// src/components/PlayScreen.tsx
<div
  key={round}
  className={styles.board}
  style={{ "--letters": longestWordLength(phrase) }}
>
  {words.map((word, wordIndex) => (
    <div className={styles.word} key={`${phrase}-${wordIndex}`}>
      {/* tiles */}
    </div>
  ))}
</div>
```

An error boundary wraps the tree. It catches a failure while rendering, including a catalog that fails to parse during the initial state function. It does not catch a bad click: event handlers are outside the boundary. The fallback offers a reload and logs the error, without printing the exception into the page.

```tsx
// src/main.tsx
createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
```

```tsx
// src/components/ErrorBoundary.tsx
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(error, info.componentStack);
  }

  override render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="screen">
        <h1>Something went wrong</h1>
        <TextButton onClick={() => window.location.reload()}>Reload</TextButton>
      </main>
    );
  }
}
```

## Components

Screens are functions of props. The tree is one level deep, so there is no context provider and no store.

```tsx
// src/components/PlayScreen.tsx
type PlayScreenProps = {
  category: CategoryName;
  phrase: string;
  guessed: ReadonlySet<string>;
  misses: number;
  overlay: Overlay;
  note: string | null;
  round: number;
  onPause: () => void;
  onGuess: (letter: string) => void;
};
```

Buttons are `type="button"` after the prop spread, so a caller cannot turn them into submit buttons. Icon buttons take a `label` and set `aria-label` from it. The icon is `alt=""`. `ref` is a normal prop (React 19) and is forwarded so the dialog can focus a `TextButton`.

```tsx
// src/components/Buttons.tsx
type IconButtonProps = {
  label: string;
  icon: string;
  size?: "nav" | "play";
} & Omit<ComponentPropsWithRef<"button">, "type" | "aria-label" | "children">;

export function IconButton({ label, icon, size = "nav", className, ref, ...props }: IconButtonProps) {
  return (
    <button
      {...props}
      ref={ref}
      type="button"
      className={classNames("icon-btn", size === "play" ? "icon-btn-play" : "icon-btn-nav", className)}
      aria-label={label}
    >
      <img src={icon} alt="" />
    </button>
  );
}
```

Conditional UI uses a ternary that renders `null`. A live region for the status string is mounted for the whole session, so assistive tech hears the update when the text changes.

```tsx
// src/App.tsx
<p className="sr-only" aria-live="polite" aria-atomic="true">
  {state.status}
</p>
{state.screen === "menu" ? <MenuScreen onPlay={/* ... */} onHowTo={/* ... */} /> : null}
{state.screen === "play" && state.category && state.phrase ? <PlayScreen /* ... */ /> : null}
```

```tsx
// src/components/PlayScreen.tsx
{note ? (
  <p className={styles.note} aria-hidden="true">
    {note}
  </p>
) : null}
```

List keys are stable letters on the keyboard and category names on the picker. The keyboard rows are module data, not arrays allocated inside render.

```tsx
// src/components/PlayScreen.tsx
{KEY_ROWS.map((row) => (
  <div className={styles.row} key={row[0]}>
    {row.map((letter) => (
      <button key={letter} type="button" disabled={guessed.has(letter)} onClick={() => onGuess(letter)}>
        {letter}
      </button>
    ))}
  </div>
))}
```

```tsx
// src/components/CategoryScreen.tsx
{CATEGORIES.map((category) => (
  <TextButton key={category} onClick={() => onChoose(category)}>
    {category}
  </TextButton>
))}
```

`useCallback` and `React.memo` are not used. Every guess already changes the props the play screen reads, and the handlers are cheap. Memoizing them would not skip a render.

```tsx
// src/App.tsx — a new function each render is enough here
onGuess={(letter) => dispatch({ type: "guess", letter })}
onPause={() => dispatch({ type: "pause" })}
```

Custom properties such as `--letters` are typed by augmenting `CSSProperties`, so the board style does not need a cast.

```ts
// src/css-custom-properties.d.ts
export {};

declare module "react" {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}
```

```tsx
// src/components/PlayScreen.tsx
style={{ "--letters": longestWordLength(phrase) }}
```

## Compiler flags

`strict`, `verbatimModuleSyntax`, `noFallthroughCasesInSwitch`, `noImplicitOverride`, `noImplicitReturns`, `exactOptionalPropertyTypes`, and `forceConsistentCasingInFileNames` are on.

```json
// tsconfig.app.json
{
  "compilerOptions": {
    "strict": true,
    "verbatimModuleSyntax": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

`verbatimModuleSyntax` is why type-only imports stay explicit:

```ts
import { MAX_LIVES, type Action, type Catalog, type CategoryName, type State } from "./types";
```

`exactOptionalPropertyTypes` is why an optional field is omitted instead of set to `undefined`:

```ts
avoid === null ? { random } : { random, avoid }
```

`noUncheckedIndexedAccess` is off. CSS modules are typed as a string index signature, and that flag would turn every `styles.tile` into `string | undefined`. Array reads that can actually miss (`pool.at`, `counts.at`) are narrowed at the use site instead.

```ts
// src/game/phrase.ts
const last = counts.at(-1);
if (last === undefined) return "No letters.";

const chosen = pool.at(index);
if (!chosen) throw new Error(`No titles in ${category}`);
```

## Tests

Reducer tests cover illegal transitions, chained deals, a recycled category, and a cloned catalog. A fixed `pick` keeps the deal deterministic.

```ts
// src/game/reducer.test.ts
it("starts a round only from the category screen", () => {
  const menu = createInitialState();
  expect(reducer(menu, { type: "start", category: "Countries", pick: 0 })).toBe(menu);

  const next = reducer(
    { ...createInitialState(), screen: "categories", catalog: catalog() },
    { type: "start", category: "Countries", pick: 0 },
  );
  expect(next.phrase).toBe("Peru");
  expect(next.round).toBe(1);
  expect(next.catalog.Countries[0]?.selected).toBe(true);
});

it("plays again only after a win or loss, and chains the catalog", () => {
  const state = playing();
  expect(reducer(state, { type: "play-again", pick: 0 })).toBe(state);
});
```

Catalog tests cover the bundled JSON and the rejected shapes.

```ts
// src/game/catalog.test.ts
it("rejects unknown categories, empty lists, blank names, and duplicates", () => {
  expect(() => parseCatalog({ categories: { Movies: [titled("Alien")], Extra: [] } })).toThrow(
    /Unknown category/,
  );
  expect(() => parseCatalog(withCategories({ Movies: [titled("  ")] }))).toThrow(/name/);
  expect(() => parseCatalog(withCategories({ Animals: [titled("Fox"), titled("Fox")] }))).toThrow(
    /Duplicate title "Fox"/,
  );
});
```

Phrase tests cover tokenization, the win rule, and samples outside `0..1`. The alphabet test locks the keyboard at 26 distinct letters.

```ts
// src/game/phrase.test.ts
expect(tokenize("A1-b")).toEqual([
  [
    { kind: "letter", value: "A" },
    { kind: "mark", value: "1" },
    { kind: "mark", value: "-" },
    { kind: "letter", value: "B" },
  ],
]);

expect(deal(catalog(titles), "Movies", { random: () => Number.NaN }).phrase).toBe("Alien");

const letters = KEY_ROWS.flat();
expect(new Set(letters).size).toBe(26);
expect(letterFromKey("q")).toBe("Q");
expect(letterFromKey("Enter")).toBeNull();
```

UI behavior (focus, dialog, keyboard guesses, pause, play again, quit) is checked in the browser against the dev server. There is no DOM test runner.
