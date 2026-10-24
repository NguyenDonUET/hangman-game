import backIcon from "../assets/images/icon-back.svg";
import { IconButton } from "./Buttons";
import { useFocusHeading } from "./useFocusHeading";
import styles from "./HowToScreen.module.css";

const STEPS = [
  {
    title: "Choose a category",
    body: "First, choose a word category, like animals or movies. The computer then randomly selects a secret word from that topic and shows you blanks for each letter of the word.",
  },
  {
    title: "Guess letters",
    body: "Take turns guessing letters. The computer fills in the relevant blank spaces if your guess is correct. If it's wrong, you lose some health, which empties after eight incorrect guesses.",
  },
  {
    title: "Win or lose",
    body: "You win by guessing all the letters in the word before your health runs out. If the health bar empties before you guess the word, you lose.",
  },
] as const;

type HowToScreenProps = {
  onBack: () => void;
};

export function HowToScreen({ onBack }: HowToScreenProps) {
  const headingRef = useFocusHeading<HTMLHeadingElement>("how-to");

  return (
    <main className={`screen ${styles.page}`}>
      <header className={styles.header}>
        <IconButton label="Back to menu" icon={backIcon} onClick={onBack} />
        <h1 ref={headingRef} tabIndex={-1} className={styles.title}>
          How to Play
        </h1>
        <span className={styles.balance} aria-hidden="true" />
      </header>
      <ol className={styles.steps}>
        {STEPS.map((step, index) => (
          <li key={step.title} className={styles.card}>
            <span className={styles.badge} aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h2>{step.title}</h2>
            <p>{step.body}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
