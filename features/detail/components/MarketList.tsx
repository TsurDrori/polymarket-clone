import type { PolymarketMarket } from "@/features/events/types";
import { cn } from "@/shared/lib/cn";
import { MarketRow } from "./MarketRow";
import styles from "./MarketList.module.css";

type MarketListProps = {
  markets: ReadonlyArray<PolymarketMarket>;
};

export function MarketList({ markets }: MarketListProps) {
  return (
    <section className={styles.section} aria-label="Markets">
      <div className={styles.list}>
        {markets.map((market) => (
          <MarketRow key={market.id} market={market} className={cn(styles.row)} />
        ))}
      </div>
    </section>
  );
}
