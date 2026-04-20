import { PriceCell } from "./PriceCell";
import styles from "./OutcomePill.module.css";

type OutcomePillProps = {
  tone: "yes" | "no";
  label: string;
  tokenId?: string;
  fallbackPrice: number;
  compact?: boolean;
};

export function OutcomePill({
  tone,
  label,
  tokenId,
  fallbackPrice,
  compact = false,
}: OutcomePillProps) {
  return (
    <span
      className={styles.pill}
      data-tone={tone}
      data-compact={compact ? "true" : "false"}
    >
      <span className={styles.label} title={label}>
        {label}
      </span>
      <span className={styles.price}>
        {tokenId ? (
          <PriceCell
            tokenId={tokenId}
            formatKind="pct"
            fallbackValue={fallbackPrice}
          />
        ) : (
          `${Math.round(fallbackPrice * 100)}%`
        )}
      </span>
    </span>
  );
}
