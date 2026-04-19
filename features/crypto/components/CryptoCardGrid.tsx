import { CryptoCard } from "./CryptoCard";
import styles from "./CryptoCardGrid.module.css";
import type { CryptoCardModel } from "../parse";

type CryptoCardGridProps = {
  cards: ReadonlyArray<CryptoCardModel>;
};

export function CryptoCardGrid({ cards }: CryptoCardGridProps) {
  return (
    <div className={styles.grid}>
      {cards.map((card) => (
        <CryptoCard key={card.id} card={card} />
      ))}
    </div>
  );
}
