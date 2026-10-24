import { useEffect, useReducer } from "react";
import { CategoryScreen } from "./components/CategoryScreen";
import { GameDialog } from "./components/GameDialog";
import { HowToScreen } from "./components/HowToScreen";
import { MenuScreen } from "./components/MenuScreen";
import { PlayScreen } from "./components/PlayScreen";
import { deal, openingStatus } from "./game/phrase";
import { createInitialState, reducer } from "./game/reducer";
import type { CategoryName } from "./game/types";

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  useEffect(() => {
    if (state.screen !== "play" || state.overlay) return;

    function onKey(event: KeyboardEvent) {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      if (!/^[a-zA-Z]$/.test(event.key)) return;
      event.preventDefault();
      dispatch({ type: "guess", letter: event.key.toUpperCase() });
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.screen, state.overlay]);

  function start(category: CategoryName) {
    const result = deal(state.catalog, category);
    dispatch({
      type: "deal",
      category,
      phrase: result.phrase,
      catalog: result.catalog,
      status: openingStatus(category, result.phrase, result.recycled),
      note: result.recycled ? `Every ${category} title has been played. Starting over.` : null,
    });
  }

  function playAgain() {
    if (!state.category || !state.phrase) return;
    const result = deal(state.catalog, state.category, { avoid: state.phrase });
    dispatch({
      type: "deal",
      category: state.category,
      phrase: result.phrase,
      catalog: result.catalog,
      status: openingStatus(state.category, result.phrase, result.recycled),
      note: result.recycled
        ? `Every ${state.category} title has been played. Starting over.`
        : null,
    });
  }

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
        <CategoryScreen onBack={() => dispatch({ type: "show-menu" })} onChoose={start} />
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
            onPause={() => dispatch({ type: "pause" })}
            onGuess={(letter) => dispatch({ type: "guess", letter })}
          />
          {state.overlay ? (
            <GameDialog
              mode={state.overlay}
              phrase={state.phrase}
              onResume={() => dispatch({ type: "resume" })}
              onPlayAgain={playAgain}
              onNewCategory={() => dispatch({ type: "show-categories" })}
              onQuit={() => dispatch({ type: "quit" })}
            />
          ) : null}
        </>
      ) : null}
    </>
  );
}
