import type { PolymarketMarket } from "@/features/events/types";
import { formatPct } from "@/shared/lib/format";
import { Button } from "@/shared/ui/Button";
import { PriceCell } from "./PriceCell";
import styles from "./MicroEventBody.module.css";

type MicroEventBodyProps = {
  market: Pick<PolymarketMarket, "clobTokenIds">;
  coin: string;
};

export function MicroEventBody({ market, coin }: MicroEventBodyProps) {
  const upTokenId = market.clobTokenIds[0];

  return (
    <div className={styles.root}>
      <div className={styles.badge}>LIVE · {coin}</div>

      <div className={styles.headline}>
        {upTokenId ? (
          <PriceCell
            tokenId={upTokenId}
            format={formatPct}
            className={styles.headlinePrice}
          />
        ) : (
          <span className={styles.headlinePrice}>0%</span>
        )}
      </div>

      <div className={styles.actions}>
        <Button variant="yes" className={styles.actionButton}>
          Up
        </Button>
        <Button variant="no" className={styles.actionButton}>
          Down
        </Button>
      </div>
    </div>
  );
}
