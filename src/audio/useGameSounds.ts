import { useCallback, useEffect, useRef, useState } from "react";
import { soundCue } from "../game/soundCue";
import type { State } from "../game/types";
import { playCue } from "./sounds";

const MUTED_KEY = "hangman:muted";

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTED_KEY) === "true";
  } catch {
    return false;
  }
}

export function useMuted(): [boolean, () => void] {
  const [muted, setMuted] = useState(readMuted);

  useEffect(() => {
    try {
      localStorage.setItem(MUTED_KEY, String(muted));
    } catch {
      // Storage can be unavailable (private mode, quota); the toggle still works for this session.
    }
  }, [muted]);

  const toggle = useCallback(() => setMuted((value) => !value), []);
  return [muted, toggle];
}

export function useGameSounds(state: State, muted: boolean) {
  const previous = useRef(state);

  useEffect(() => {
    const cue = soundCue(previous.current, state);
    previous.current = state;
    if (cue && !muted) playCue(cue);
  }, [state, muted]);
}
