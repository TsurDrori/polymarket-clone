import { Skeleton } from "@/shared/ui/Skeleton";
import styles from "./CardSkeleton.module.css";

export function CardSkeleton() {
  return (
    <div aria-hidden="true" className={styles.shell}>
      <div className={styles.header}>
        <Skeleton className={styles.image} />
        <div className={styles.title}>
          <Skeleton className={styles.titleLineLong} />
          <Skeleton className={styles.titleLineShort} />
        </div>
      </div>

      <div className={styles.body}>
        <Skeleton className={styles.bodyLine} />
        <div className={styles.actionRow}>
          <Skeleton className={styles.action} />
          <Skeleton className={styles.action} />
        </div>
      </div>

      <Skeleton className={styles.footer} />
    </div>
  );
}
