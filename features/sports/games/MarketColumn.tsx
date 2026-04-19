import { PriceCell } from "@/features/events/components/PriceCell";
import type { SportsbookMarketCell } from "./parse";
import styles from "./MarketColumn.module.css";

type MarketColumnProps = {
  entries: ReadonlyArray<SportsbookMarketCell>;
};

export function MarketColumn({ entries }: MarketColumnProps) {
  if (entries.length === 0) {
    return (
      <div className={styles.column}>
        <span className={styles.missing}>--</span>
      </div>
    );
  }

  return (
    <div className={styles.column}>
      {entries.map((entry) => (
        <div key={entry.key} className={styles.entry}>
          <span className={styles.label}>{entry.label}</span>
          {entry.tokenId ? (
            <PriceCell
              tokenId={entry.tokenId}
              formatKind="cents"
              className={styles.price}
            />
          ) : (
            <span className={styles.missing}>--</span>
          )}
        </div>
      ))}
    </div>
  );
}
