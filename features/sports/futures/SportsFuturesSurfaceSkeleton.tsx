import { Skeleton } from "@/shared/ui/Skeleton";
import styles from "./SportsFuturesSurfaceSkeleton.module.css";

type SportsFuturesSurfaceSkeletonProps = {
  cardCount?: number;
};

export function SportsFuturesSurfaceSkeleton({
  cardCount = 3,
}: SportsFuturesSurfaceSkeletonProps) {
  return (
    <section className={styles.surface} aria-busy="true" aria-live="polite">
      <div className={styles.switchRow}>
        <Skeleton className={styles.switchPillMuted} />
        <Skeleton className={styles.switchPill} />
      </div>

      <div className={styles.header}>
        <Skeleton className={styles.title} />
        <Skeleton className={styles.copy} />
      </div>

      <div className={styles.rail}>
        <Skeleton className={styles.chipWide} />
        <Skeleton className={styles.chip} />
        <Skeleton className={styles.chip} />
        <Skeleton className={styles.chipWide} />
      </div>

      <div className={styles.filterBar}>
        <Skeleton className={styles.filterPillWide} />
        <Skeleton className={styles.filterPill} />
        <Skeleton className={styles.filterPill} />
      </div>

      {cardCount > 0 ? (
        <div className={styles.cards}>
          {Array.from({ length: cardCount }, (_, index) => (
            <article key={index} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitleRow}>
                  <Skeleton className={styles.cardIcon} />
                  <div className={styles.cardText}>
                    <Skeleton className={styles.cardTitle} />
                    <Skeleton className={styles.cardMeta} />
                  </div>
                </div>
                <Skeleton className={styles.link} />
              </div>

              <div className={styles.rows}>
                {Array.from({ length: 4 }, (_, rowIndex) => (
                  <div key={rowIndex} className={styles.row}>
                    <Skeleton className={styles.rowLabel} />
                    <Skeleton className={styles.rowValue} />
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.emptyBlock}>
          <Skeleton className={styles.emptyTitle} />
          <Skeleton className={styles.emptyCopy} />
        </div>
      )}
    </section>
  );
}
