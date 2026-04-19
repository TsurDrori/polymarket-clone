import styles from "./CryptoSurfaceSkeleton.module.css";

const CARD_COUNT = 6;

export function CryptoSurfaceSkeleton() {
  return (
    <section className={styles.surface} aria-busy="true" aria-live="polite">
      <div className={styles.mobileFilters}>
        <div className={styles.filterRow}>
          {Array.from({ length: 4 }, (_, index) => (
            <span key={`mobile-filter-${index}`} className={styles.filterChip} />
          ))}
        </div>
      </div>

      <div className={styles.layout}>
        <aside className={styles.desktopRail}>
          <div className={styles.railBlock}>
            {Array.from({ length: 8 }, (_, index) => (
              <span key={`rail-${index}`} className={styles.railItem} />
            ))}
          </div>
        </aside>

        <div className={styles.content}>
          <header className={styles.header}>
            <div className={styles.titleBlock} />
            <div className={styles.tabRow}>
              {Array.from({ length: 5 }, (_, index) => (
                <span key={`tab-${index}`} className={styles.tab} />
              ))}
            </div>
          </header>

          <div className={styles.grid}>
            {Array.from({ length: CARD_COUNT }, (_, index) => (
              <article key={`card-${index}`} className={styles.card}>
                <div className={styles.cardTop}>
                  <span className={styles.icon} />
                  <div className={styles.cardHeading}>
                    <span className={styles.cardTitleShort} />
                    <span className={styles.cardTitleLong} />
                  </div>
                </div>
                <div className={styles.rows}>
                  <span className={styles.row} />
                  <span className={styles.row} />
                </div>
                <span className={styles.meta} />
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
