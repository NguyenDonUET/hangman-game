import { useEffect, useReducer } from "react";
import { useGameSounds, useMuted } from "./audio/useGameSounds";
import { CategoryScreen } from "./components/CategoryScreen";
import { GameDialog } from "./components/GameDialog";
import { HowToScreen } from "./components/HowToScreen";
import { MenuScreen } from "./components/MenuScreen";
import { PlayScreen } from "./components/PlayScreen";
import { letterFromKey } from "./game/alphabet";
import { createInitialState, reducer } from "./game/reducer";

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const [muted, toggleMuted] = useMuted();
  useGameSounds(state, muted);

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

  return (
    <>
      <div className="backdrop" />
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {state.status}
      </p>
      {state.screen === "menu" ? (
        <MenuScreen
          onPlay={() => dispatch({ type: "show-categories" })}
          onHowTo={() => dispatch({ type: "show-how-to" })}
        />
      ) : null}
      {state.screen === "howTo" ? (
        <HowToScreen onBack={() => dispatch({ type: "show-menu" })} />
      ) : null}
      {state.screen === "categories" ? (
        <CategoryScreen
          onBack={() => dispatch({ type: "show-menu" })}
          onChoose={(category) => dispatch({ type: "start", category, pick: Math.random() })}
        />
      ) : null}
      {state.screen === "play" && state.category && state.phrase ? (
        <>
          <PlayScreen
            category={state.category}
            phrase={state.phrase}
            guessed={state.guessed}
            misses={state.misses}
            overlay={state.overlay}
            note={state.note}
            round={state.round}
            muted={muted}
            onToggleMuted={toggleMuted}
            onPause={() => dispatch({ type: "pause" })}
            onGuess={(letter) => dispatch({ type: "guess", letter })}
          />
          {state.overlay ? (
            <GameDialog
              key={state.overlay}
              mode={state.overlay}
              phrase={state.phrase}
              onResume={() => dispatch({ type: "resume" })}
              onPlayAgain={() => dispatch({ type: "play-again", pick: Math.random() })}
              onNewCategory={() => dispatch({ type: "show-categories" })}
              onQuit={() => dispatch({ type: "quit" })}
            />
          ) : null}
        </>
      ) : null}
    </>
  );
}
