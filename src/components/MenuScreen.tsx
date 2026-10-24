import logo from "../assets/images/logo.svg";
import playIcon from "../assets/images/icon-play.svg";
import { IconButton, TextButton } from "./Buttons";
import { useFocusHeading } from "./useFocusHeading";
import styles from "./MenuScreen.module.css";

type MenuScreenProps = {
  onPlay: () => void;
  onHowTo: () => void;
};

export function MenuScreen({ onPlay, onHowTo }: MenuScreenProps) {
  const headingRef = useFocusHeading<HTMLHeadingElement>("menu");

  return (
    <main className={`screen ${styles.menu}`}>
      <h1 ref={headingRef} tabIndex={-1}>
        <img className={styles.logo} src={logo} alt="Hangman" />
      </h1>
      <div className={styles.actions}>
        <IconButton label="Play" icon={playIcon} size="play" onClick={onPlay} />
        <TextButton variant="pink" onClick={onHowTo}>
          How to Play
        </TextButton>
      </div>
    </main>
  );
}
