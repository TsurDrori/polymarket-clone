import Link from "next/link";
import { CryptoCardGrid } from "./CryptoCardGrid";
import { CryptoFamilyTabs } from "./CryptoFamilyTabs";
import { CryptoFilterRail } from "./CryptoFilterRail";
import type {
  CryptoCardModel,
  CryptoFilterState,
  CryptoWorkingSet,
} from "../parse";
import styles from "./CryptoSurface.module.css";

type CryptoSurfaceProps = {
  workingSet: CryptoWorkingSet;
  filters: CryptoFilterState;
  cards: ReadonlyArray<CryptoCardModel>;
};

export function CryptoSurface({
  workingSet,
  filters,
  cards,
}: CryptoSurfaceProps) {
  return (
    <section className={styles.surface}>
      <div className={styles.mobileRail}>
        <CryptoFilterRail rail={workingSet.rail} filters={filters} />
      </div>

      <div className={styles.layout}>
        <div className={styles.desktopRail}>
          <CryptoFilterRail rail={workingSet.rail} filters={filters} />
        </div>

        <div className={styles.content}>
          <header className={styles.header}>
            <div className={styles.titleWrap}>
              <h1 className={styles.title}>Crypto</h1>
              <p className={styles.summary}>
                Public Gamma working set of {workingSet.cards.length} crypto events sorted
                by 24-hour volume.
              </p>
            </div>

            <CryptoFamilyTabs options={workingSet.familyTabs} filters={filters} />
          </header>

          {cards.length > 0 ? (
            <CryptoCardGrid cards={cards} />
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
