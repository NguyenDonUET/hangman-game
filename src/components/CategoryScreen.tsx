import backIcon from "../assets/images/icon-back.svg";
import { CATEGORIES, type CategoryName } from "../game/types";
import { IconButton, TextButton } from "./Buttons";
import { useFocusHeading } from "./useFocusHeading";
import styles from "./CategoryScreen.module.css";

type CategoryScreenProps = {
  onBack: () => void;
  onChoose: (category: CategoryName) => void;
};

export function CategoryScreen({ onBack, onChoose }: CategoryScreenProps) {
  const headingRef = useFocusHeading<HTMLHeadingElement>("categories");

  return (
    <main className={`screen ${styles.page}`}>
      <header className={styles.header}>
        <IconButton label="Back to menu" icon={backIcon} onClick={onBack} />
        <h1 ref={headingRef} tabIndex={-1} className={styles.title}>
          Pick a Category
        </h1>
        <span className={styles.balance} aria-hidden="true" />
      </header>
      <div className={styles.grid} role="group" aria-label="Categories">
        {CATEGORIES.map((category) => (
          <TextButton key={category} className={styles.category} onClick={() => onChoose(category)}>
            {category}
          </TextButton>
        ))}
      </div>
    </main>
  );
}
