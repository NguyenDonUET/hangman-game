import type { State } from "./types";

export type Cue = "hit" | "miss" | "win" | "lose";

type Snapshot = Pick<State, "round" | "overlay" | "guessed" | "misses">;

export function soundCue(previous: Snapshot, next: Snapshot): Cue | null {
  if (next.round !== previous.round) return null;
  if (next.overlay !== previous.overlay) {
    if (next.overlay === "won") return "win";
    if (next.overlay === "lost") return "lose";
  }
  if (next.guessed.size <= previous.guessed.size) return null;
  return next.misses > previous.misses ? "miss" : "hit";
}
