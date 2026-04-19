import { Skeleton } from "@/shared/ui/Skeleton";
import styles from "./loading.module.css";

const FACET_IDS = ["all", "trump", "midterms", "iran", "elections"];
const CARD_IDS = ["1", "2", "3", "4", "5", "6"];

export default function PoliticsLoading() {
  return (
    <main className={styles.main}>
      <header className={styles.header} aria-busy="true" aria-live="polite">
        <div>
          <Skeleton className={styles.kicker} />
          <Skeleton className={styles.title} />
        </div>
        <Skeleton className={styles.description} />
      </header>

      <div className={styles.facets}>
        {FACET_IDS.map((facetId) => (
          <Skeleton key={facetId} className={styles.facet} />
        ))}
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <Skeleton className={styles.sectionTitle} />
            <Skeleton className={styles.sectionCopy} />
          </div>
          <Skeleton className={styles.sectionMeta} />
        </div>

        <div className={styles.grid}>
          {CARD_IDS.map((cardId) => (
            <div key={cardId} className={styles.card}>
              <Skeleton className={styles.cardTitle} />
              <Skeleton className={styles.cardLine} />
              <Skeleton className={styles.cardLine} />
              <Skeleton className={styles.cardLineShort} />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
