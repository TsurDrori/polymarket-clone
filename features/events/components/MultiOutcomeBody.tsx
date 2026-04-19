import type { PolymarketMarket } from "@/features/events/types";
import { formatCents, formatPct } from "@/shared/lib/format";
import { Button } from "@/shared/ui/Button";
import { PriceCell } from "./PriceCell";
import styles from "./MultiOutcomeBody.module.css";

type MultiOutcomeBodyProps = {
  markets: ReadonlyArray<PolymarketMarket>;
  onNavigate?: () => void;
};

const getTopMarkets = (
  markets: ReadonlyArray<PolymarketMarket>,
): PolymarketMarket[] => [...markets].sort((a, b) => b.volumeNum - a.volumeNum).slice(0, 2);

export function MultiOutcomeBody({
  markets,
  onNavigate,
}: MultiOutcomeBodyProps) {
  const topMarkets = getTopMarkets(markets);

  return (
    <div className={styles.root}>
      {topMarkets.map((market) => {
        const yesTokenId = market.clobTokenIds[0];
        const noTokenId = market.clobTokenIds[1];
        const yesLabel = market.outcomes[0] ?? "Outcome 1";
        const noLabel = market.outcomes[1] ?? "Outcome 2";
        const rowLabel = market.groupItemTitle || market.question;

        return (
          <div key={market.id} className={styles.row}>
            <div className={styles.label} title={rowLabel}>
              {rowLabel}
            </div>

            <div className={styles.price}>
              {yesTokenId ? (
                <PriceCell tokenId={yesTokenId} format={formatPct} />
              ) : (
                <span>0%</span>
              )}
            </div>

            <Button
              variant="yes"
              size="sm"
              className={styles.actionButton}
              onClick={onNavigate}
            >
              <span className={styles.actionLabel} title={yesLabel}>
                {yesLabel}
              </span>
              {yesTokenId ? <PriceCell tokenId={yesTokenId} format={formatCents} /> : null}
            </Button>

            <Button
              variant="no"
              size="sm"
              className={styles.actionButton}
              onClick={onNavigate}
            >
              <span className={styles.actionLabel} title={noLabel}>
                {noLabel}
              </span>
              {noTokenId ? <PriceCell tokenId={noTokenId} format={formatCents} /> : null}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
