import { PriceCell } from "@/features/events/components/PriceCell";
import { cn } from "@/shared/lib/cn";
import { formatPct } from "@/shared/lib/format";
import styles from "./OutcomeActionContent.module.css";

type OutcomeActionContentProps = {
  label: string;
  tokenId?: string;
  fallbackPrice?: number;
  showPriceOnHover?: boolean;
  className?: string;
};

export function OutcomeActionContent({
  label,
  tokenId,
  fallbackPrice,
  showPriceOnHover = false,
  className,
}: OutcomeActionContentProps) {
  const shouldSwapToPrice = showPriceOnHover && fallbackPrice !== undefined;

  return (
    <span
      className={cn(styles.root, className)}
      data-price-swap={shouldSwapToPrice ? "true" : "false"}
    >
      <span className={styles.label}>{label}</span>
      {shouldSwapToPrice ? (
        <span className={styles.price} aria-hidden="true">
          {tokenId ? (
            <PriceCell tokenId={tokenId} formatKind="pct" fallbackValue={fallbackPrice} />
          ) : (
            formatPct(fallbackPrice)
          )}
        </span>
      ) : null}
    </span>
  );
}
