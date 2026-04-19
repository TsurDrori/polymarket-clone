"use client";

import type { HTMLAttributes } from "react";
import type { PolymarketMarket } from "@/features/events/types";
import { PriceCell } from "@/features/events/components/PriceCell";
import { formatCents, formatPct } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { ProbabilityBar } from "@/shared/ui/ProbabilityBar";
import styles from "./MarketRow.module.css";

type MarketRowProps = HTMLAttributes<HTMLDivElement> & {
  market: PolymarketMarket;
};

const clampPrice = (value: number | undefined): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value ?? 0));
};

const getStaticPrice = (
  market: PolymarketMarket,
  outcomeIndex: number,
): number => {
  const outcomePrice = market.outcomePrices[outcomeIndex];
  if (Number.isFinite(outcomePrice)) {
    return clampPrice(outcomePrice);
  }

  if (outcomeIndex === 1) {
    return clampPrice(1 - market.lastTradePrice);
  }

  return clampPrice(market.lastTradePrice);
};

export function MarketRow({
  market,
  className,
  ...props
}: MarketRowProps) {
  const label = market.groupItemTitle || market.question;
  const yesTokenId = market.clobTokenIds[0];
  const noTokenId = market.clobTokenIds[1];
  const yesLabel = market.outcomes[0] ?? "Yes";
  const noLabel = market.outcomes[1] ?? "No";
  const yesSeedPrice = getStaticPrice(market, 0);
  const noSeedPrice = getStaticPrice(market, 1);

  return (
    <div className={cn(styles.row, className)} {...props}>
      <div className={styles.summary}>
        <div className={styles.copy}>
          <h2 className={styles.label} title={label}>
            {label}
          </h2>
          <ProbabilityBar price={yesSeedPrice} className={styles.bar} />
        </div>

        <div className={styles.headline}>
          {yesTokenId ? (
            <PriceCell
              tokenId={yesTokenId}
              format={formatPct}
              className={styles.probability}
            />
          ) : (
            <span className={styles.probability}>0%</span>
          )}
        </div>
      </div>

      <div className={styles.actions}>
        <Button variant="yes" className={styles.actionButton}>
          <span className={styles.actionLabel} title={yesLabel}>
            {yesLabel}
          </span>
          {yesTokenId ? (
            <PriceCell tokenId={yesTokenId} format={formatCents} />
          ) : (
            <span>{formatCents(yesSeedPrice)}</span>
          )}
        </Button>

        <Button variant="no" className={styles.actionButton}>
          <span className={styles.actionLabel} title={noLabel}>
            {noLabel}
          </span>
          {noTokenId ? (
            <PriceCell tokenId={noTokenId} format={formatCents} />
          ) : (
            <span>{formatCents(noSeedPrice)}</span>
          )}
        </Button>
      </div>
    </div>
  );
}
