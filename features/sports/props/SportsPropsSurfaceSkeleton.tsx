import { Skeleton } from "@/shared/ui/Skeleton";
import styles from "./SportsPropsSurfaceSkeleton.module.css";

const CARD_COUNT = 6;

export function SportsPropsSurfaceSkeleton() {
  return (
    <section className={styles.surface} aria-busy="true" aria-live="polite">
      <div className={styles.switchRow}>
        <Skeleton className={styles.switchPillMuted} />
        <Skeleton className={styles.switchPill} />
      </div>

      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <Skeleton className={styles.title} />
          <Skeleton className={styles.copy} />
        </div>
        <div className={styles.routeSwitch}>
          <Skeleton className={styles.routePillMuted} />
          <Skeleton className={styles.routePill} />
        </div>
      </div>

      <div className={styles.grid}>
        {Array.from({ length: CARD_COUNT }, (_, index) => (
          <article key={index} className={styles.card}>
            <div className={styles.cardTop}>
              <Skeleton className={styles.icon} />
              <div className={styles.cardHeading}>
                <Skeleton className={styles.cardTitleShort} />
                <Skeleton className={styles.cardTitleLong} />
              </div>
            </div>

            <div className={styles.rows}>
              {Array.from({ length: 2 }, (_, rowIndex) => (
                <div key={rowIndex} className={styles.row}>
                  <Skeleton className={styles.rowTitle} />
                  <Skeleton className={styles.rowValue} />
                  <div className={styles.actions}>
                    <Skeleton className={styles.action} />
                    <Skeleton className={styles.action} />
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.metaRow}>
              <Skeleton className={styles.meta} />
              <Skeleton className={styles.link} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
