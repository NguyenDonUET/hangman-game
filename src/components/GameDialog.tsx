import { useEffect, useRef } from "react";
import type { Overlay } from "../game/types";
import { TextButton } from "./Buttons";
import styles from "./GameDialog.module.css";

const TITLES: Record<Exclude<Overlay, null>, string> = {
  paused: "Paused",
  won: "You Win",
  lost: "You Lose",
};

type GameDialogProps = {
  mode: Exclude<Overlay, null>;
  phrase: string;
  onResume: () => void;
  onPlayAgain: () => void;
  onNewCategory: () => void;
  onQuit: () => void;
};

export function GameDialog({
  mode,
  phrase,
  onResume,
  onPlayAgain,
  onNewCategory,
  onQuit,
}: GameDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
    };
  }, []);

  const answered = mode === "won" || mode === "lost";

  return (
    <dialog
      ref={dialogRef}
      className={styles.modal}
      aria-labelledby="result-title"
      aria-describedby={answered ? "result-detail" : undefined}
      onCancel={(event) => {
        event.preventDefault();
        if (mode === "paused") onResume();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && mode === "paused") onResume();
      }}
    >
      <div className={styles.stack}>
        <h2 className="display" id="result-title">
          <span className="stroke" aria-hidden="true">
            {TITLES[mode]}
          </span>
          <span className="fill">{TITLES[mode]}</span>
        </h2>
        {answered ? (
          <p className={styles.answer} id="result-detail">
            {mode === "won" ? "You got it." : `The answer was ${phrase}.`}
          </p>
        ) : null}
        <div className={styles.actions}>
          {mode === "paused" ? (
            <TextButton variant="pink" onClick={onResume}>
              Continue
            </TextButton>
          ) : (
            <TextButton variant="pink" onClick={onPlayAgain}>
              Play again!
            </TextButton>
          )}
          <TextButton onClick={onNewCategory}>New category</TextButton>
          <TextButton onClick={onQuit}>Quit game</TextButton>
        </div>
      </div>
    </dialog>
  );
}
