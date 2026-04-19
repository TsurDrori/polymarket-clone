import { Skeleton } from "@/shared/ui/Skeleton";
import styles from "./loading.module.css";

const SIDE_CARD_IDS = ["a", "b", "c", "d"];
const MARKET_CARD_IDS = ["1", "2", "3", "4", "5", "6"];

export default function Loading() {
  return (
    <main className={styles.main}>
      <section className={styles.heroSection} aria-busy="true" aria-live="polite">
        <div className={styles.sectionHeader}>
          <div>
            <Skeleton className={styles.eyebrow} />
            <Skeleton className={styles.heading} />
          </div>
        </div>

        <div className={styles.featuredLayout}>
          <div className={styles.heroCard}>
            <Skeleton className={styles.heroMedia} />
            <Skeleton className={styles.heroTitle} />
            <Skeleton className={styles.heroCopy} />
            <Skeleton className={styles.heroCopyShort} />
            <div className={styles.heroButtons}>
              <Skeleton className={styles.heroButton} />
              <Skeleton className={styles.heroButton} />
            </div>
          </div>

          <div className={styles.sideGrid}>
            {SIDE_CARD_IDS.map((cardId) => (
              <div key={cardId} className={styles.sideCard}>
                <Skeleton className={styles.sideTitle} />
                <Skeleton className={styles.sideCopy} />
                <Skeleton className={styles.sideCopyShort} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className={styles.panelRow}>
        <section className={styles.panel}>
          <Skeleton className={styles.panelTitle} />
          <Skeleton className={styles.panelLine} />
          <Skeleton className={styles.panelLine} />
          <Skeleton className={styles.panelLineShort} />
        </section>

        <section className={styles.panel}>
          <Skeleton className={styles.panelTitle} />
          <Skeleton className={styles.panelLine} />
          <Skeleton className={styles.panelLine} />
          <Skeleton className={styles.panelLineShort} />
        </section>
      </div>

      <section className={styles.marketSection}>
        <div className={styles.sectionHeader}>
          <div>
            <Skeleton className={styles.eyebrow} />
            <Skeleton className={styles.subheading} />
          </div>
        </div>

        <div className={styles.marketGrid}>
          {MARKET_CARD_IDS.map((cardId) => (
            <div key={cardId} className={styles.marketCard}>
              <Skeleton className={styles.marketTitle} />
              <Skeleton className={styles.marketLine} />
              <Skeleton className={styles.marketLine} />
              <Skeleton className={styles.marketLineShort} />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
