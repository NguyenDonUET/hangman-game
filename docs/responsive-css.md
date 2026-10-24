# Responsive layout

The layout is CSS. React passes one measurement into it: `--letters`, the longest word's letter count. Everything else is fluid type, container queries, and a few breakpoints for structure that should change, not just scale.

The viewport meta tag is `width=device-width, initial-scale=1`. Page shells use `min-height: 100dvh`, so the height follows the visible viewport when a mobile browser shows or hides its chrome. `touch-action: manipulation` on buttons drops the double-tap zoom delay.

## Fluid scale

Shared sizes live on `:root` (`--tile`, `--gap`, colors, the pill radius). Components then override them locally.

`clamp(min, preferred, max)` is the default for type, padding, and controls. `.screen` padding is `clamp(20px, 4vw, 60px)`. The play title, category title, how-to headings, and the result wordmark all scale with the viewport and stop at a designed maximum. Icon buttons use the same idea: nav buttons are `clamp(48px, 7vw, 86px)`, the play button is `clamp(156px, 22vw, 200px)`.

`min()` caps a region without a media query. The logo is `min(374px, 78vw)`. The category and how-to columns are `min(1100px, 100%)` and `min(1120px, 100%)`. The dialog stack is `min(420px, 86vw)` with `max-width: calc(100vw - 32px)`.

The menu has no breakpoint. Centering, a fluid logo, and `clamp` on the vertical gap cover that screen.

## The board and the keyboard are containers

`.fit` and `.keyboard` set `container-type: inline-size` and `width: min(100%, 1040px)`. Their children size from `cqi` (1% of that container), not from the viewport. A board in a narrow column shrinks even when the window is wide.

Tile size:

```css
--gap: clamp(6px, 1.2cqi, 14px);
--tile: min(96px, calc((100cqi - (var(--letters) - 1) * var(--gap)) / var(--letters)));
```

`--letters` comes from the phrase. The formula is the largest square, at most 96px, that lets that many letters and the gaps between them sit on one line of the container. Words are `flex-wrap: nowrap`. The board wraps between words. A long title gets smaller tiles. A short one stays at 96px and centers.

Letter keys use the same container:

```css
width: min(84px, calc((100cqi - 8 * var(--kgap)) / 9));
aspect-ratio: 1;
```

The longest row has nine letters and eight gaps. Keys stay square and the row stays inside the container.

Punctuation is extra. An apostrophe is about `0.34 * tile` wide and adds a gap, and `--letters` counts only letters. `Schindler's List` is the title this shows up on. On a very narrow container that word can run slightly past the formula. The mark is kept visible on purpose. It is not a guessable tile.

The health fill animates `transform: scaleX(...)` from the left, which stays on the compositor. Tile reveals use a short `transform` pop.

## Where the structure changes

| Viewport | What changes |
| --- | --- |
| Play header, max-width 560px | The title wraps onto its own centered row. Health sits on the first row, to the right of Pause. |
| How-to header, max-width 600px | The balancing spacer is removed. The title aligns left beside Back. |
| Category grid, max-width 640px | One column. The header drops the spacer. Category buttons use a fixed mobile size. |
| Backdrop, min-width 768px | Tablet background art replaces the mobile art. |
| How-to steps, max-width 900px | Three cards become one column, capped at 460px. |
| Category grid, max-width 1000px | Three columns become two. |
| Backdrop, min-width 1100px | Desktop background art. |
| Play screen, max-height 760px | Vertical gap and padding tighten so the keyboard still fits. |

Category and how-to headers are `auto 1fr auto`. The third track matches the back button (`clamp(48px, 7vw, 86px)`) so the title stays optically centered. Below the small breakpoint that track is `display: none` and the title left-aligns. The button keeps a hit target. The title does not slide under it.

Background art is chosen in `min-width` queries: mobile by default, tablet from 768px, desktop from 1100px. One image wins. They are not stacked.

## Interaction and motion

Hover styles are under `@media (hover: hover)`. A touch screen does not get a sticky hover wash on a key or a button. `:active` still presses the control in (a few pixels down, a shallower inset shadow).

`:focus-visible` draws the shared white outline. Mouse clicks do not leave that ring behind.

`@media (prefers-reduced-motion: reduce)` removes transitions and animations, including the health bar and the tile pop.

`color-scheme: dark` is set on `:root` so form controls and the dialog backdrop follow the dark UI.
