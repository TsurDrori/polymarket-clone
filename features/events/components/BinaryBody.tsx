import type { PolymarketMarket } from "@/features/events/types";
import { formatCents, formatPct } from "@/shared/lib/format";
import { Button } from "@/shared/ui/Button";
import { PriceCell } from "./PriceCell";
import styles from "./BinaryBody.module.css";

type BinaryBodyProps = {
  market: PolymarketMarket;
};

export function BinaryBody({ market }: BinaryBodyProps) {
  const yesTokenId = market.clobTokenIds[0];
  const noTokenId = market.clobTokenIds[1];

  return (
    <div className={styles.root}>
      <div className={styles.headline}>
        {yesTokenId ? (
          <PriceCell
            tokenId={yesTokenId}
            format={formatPct}
            className={styles.headlinePrice}
          />
        ) : (
          <span className={styles.headlinePrice}>0%</span>
        )}
      </div>

      <div className={styles.actions}>
        <Button variant="yes" className={styles.actionButton}>
          <span>Buy Yes</span>
          {yesTokenId ? <PriceCell tokenId={yesTokenId} format={formatCents} /> : null}
        </Button>

        <Button variant="no" className={styles.actionButton}>
          <span>Buy No</span>
          {noTokenId ? <PriceCell tokenId={noTokenId} format={formatCents} /> : null}
        </Button>
      </div>
    </div>
  );
}
