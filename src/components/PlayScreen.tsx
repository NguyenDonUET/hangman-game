import type { CSSProperties } from "react";
import heart from "../assets/images/icon-heart.svg";
import menuIcon from "../assets/images/icon-menu.svg";
import { longestWordLength, speakPuzzle, tokenize } from "../game/phrase";
import type { CategoryName, Overlay } from "../game/types";
import { MAX_LIVES } from "../game/types";
import { IconButton } from "./Buttons";
import { useFocusHeading } from "./useFocusHeading";
import styles from "./PlayScreen.module.css";

const ROWS = ["ABCDEFGHI", "JKLMNOPQR", "STUVWXYZ"];

type PlayScreenProps = {
  category: CategoryName;
  phrase: string;
  guessed: ReadonlySet<string>;
  misses: number;
  overlay: Overlay;
  note: string | null;
  onPause: () => void;
  onGuess: (letter: string) => void;
};

export function PlayScreen({
  category,
  phrase,
  guessed,
  misses,
  overlay,
  note,
  onPause,
  onGuess,
}: PlayScreenProps) {
  const headingRef = useFocusHeading<HTMLHeadingElement>(phrase);
  const lives = MAX_LIVES - misses;
  const words = tokenize(phrase);
  const revealMisses = overlay === "lost";
  const puzzle = speakPuzzle(phrase, guessed, revealMisses);

  return (
    <main className={`screen ${styles.play}`}>
      <header className={styles.header}>
        <IconButton
          label="Pause game"
          icon={menuIcon}
          onClick={onPause}
          aria-haspopup="dialog"
          aria-expanded={overlay === "paused"}
          disabled={overlay !== null}
        />
        <h1 ref={headingRef} tabIndex={-1} className={styles.title}>
          {category}
        </h1>
        <div className={styles.health}>
          <div
            className={styles.track}
            role="meter"
            aria-label="Health"
            aria-valuemin={0}
            aria-valuemax={MAX_LIVES}
            aria-valuenow={lives}
            aria-valuetext={`${lives} of ${MAX_LIVES} lives`}
          >
            <span
              className={styles.fill}
              style={{ transform: `scaleX(${lives / MAX_LIVES})` }}
            />
          </div>
          <img className={styles.heart} src={heart} alt="" />
        </div>
      </header>

      {note ? (
        <p className={styles.note} aria-hidden="true">
          {note}
        </p>
      ) : null}

      <div className={styles.stage}>
        <div className={styles.fit}>
        <div
          className={styles.board}
          role="group"
          aria-label={`Puzzle. ${puzzle}`}
          style={{ "--letters": longestWordLength(phrase) } as CSSProperties}
          {...(import.meta.env.DEV ? { "data-phrase": phrase } : {})}
        >
          {words.map((word, wordIndex) => (
            <div className={styles.word} key={`${phrase}-${wordIndex}`}>
              {word.map((token, tokenIndex) => {
                if (token.kind === "mark") {
                  return (
                    <span className={styles.mark} key={`${token.value}-${tokenIndex}`} aria-hidden="true">
                      {token.value}
                    </span>
                  );
                }
                const revealed = guessed.has(token.value);
                const missed = revealMisses && !revealed;
                const className = [
                  styles.tile,
                  revealed ? styles.revealed : "",
                  missed ? styles.missed : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <span className={className} key={`${token.value}-${tokenIndex}`} aria-hidden="true">
                    {revealed || missed ? token.value : ""}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
        </div>
      </div>

      <div className={styles.keyboard} role="group" aria-label="Letter keys">
        {ROWS.map((row) => (
          <div className={styles.row} key={row}>
            {row.split("").map((letter) => {
              const used = guessed.has(letter);
              return (
                <button
                  key={letter}
                  type="button"
                  className={styles.key}
                  disabled={used}
                  aria-label={used ? `${letter}, guessed` : letter}
                  onClick={() => onGuess(letter)}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </main>
  );
}
