import { Skeleton } from "@/shared/ui/Skeleton";
import styles from "./loading.module.css";
import pageStyles from "./page.module.css";

const SKELETON_ROWS = 5;

export default function Loading() {
  return (
    <main className={pageStyles.main} aria-busy="true" aria-live="polite">
      <section className={styles.headerCard}>
        <Skeleton className={styles.headerImage} />
        <div className={styles.headerCopy}>
          <Skeleton className={styles.headerTitle} />
          <Skeleton className={styles.headerMeta} />
        </div>
      </section>

      <section className={styles.listCard}>
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <div key={index} className={styles.row}>
            <div className={styles.rowTop}>
              <div className={styles.rowCopy}>
                <Skeleton className={styles.rowLabel} />
                <Skeleton className={styles.rowBar} />
              </div>
              <Skeleton className={styles.rowProbability} />
            </div>
            <div className={styles.rowActions}>
              <Skeleton className={styles.rowButton} />
              <Skeleton className={styles.rowButton} />
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
