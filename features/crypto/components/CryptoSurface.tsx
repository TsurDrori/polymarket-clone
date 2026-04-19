import Link from "next/link";
import { CryptoCardGrid } from "./CryptoCardGrid";
import { CryptoFamilyTabs } from "./CryptoFamilyTabs";
import { CryptoFilterRail } from "./CryptoFilterRail";
import type {
  CryptoCardModel,
  CryptoFacetState,
  CryptoFilterState,
} from "../parse";
import styles from "./CryptoSurface.module.css";

type CryptoSurfaceProps = {
  totalCount: number;
  facets: CryptoFacetState;
  filters: CryptoFilterState;
  cards: ReadonlyArray<CryptoCardModel>;
  initialVisibleCount?: number;
  visibleIncrement?: number;
};

export function CryptoSurface({
  totalCount,
  facets,
  filters,
  cards,
  initialVisibleCount,
  visibleIncrement,
}: CryptoSurfaceProps) {
  return (
    <section className={styles.surface}>
      <div className={styles.layout}>
        <div className={styles.rail}>
          <CryptoFilterRail rail={facets.rail} filters={filters} />
        </div>

        <div className={styles.content}>
          <header className={styles.header}>
            <div className={styles.titleWrap}>
              <h1 className={styles.title}>Crypto</h1>
              <p className={styles.summary}>
                Public Gamma working set of {totalCount} crypto events sorted by
                24-hour volume.
              </p>
            </div>

            <CryptoFamilyTabs options={facets.familyTabs} filters={filters} />
          </header>

          {cards.length > 0 ? (
            <CryptoCardGrid
              cards={cards}
              initialCount={initialVisibleCount}
              incrementCount={visibleIncrement}
            />
          ) : (
            <div className={styles.emptyState}>
              <h2 className={styles.emptyTitle}>No crypto markets match those filters.</h2>
              <p className={styles.emptyCopy}>
                Try a broader time bucket or jump back to the full crypto surface.
              </p>
              <Link href="/crypto" className={styles.resetLink}>
                Reset filters
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
