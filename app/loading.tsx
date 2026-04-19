import { CardSkeleton } from "@/features/events/components/CardSkeleton";
import eventGridStyles from "@/features/events/components/EventGrid.module.css";
import styles from "./page.module.css";

const SKELETON_COUNT = 12;

export default function Loading() {
  return (
    <main className={styles.main}>
      <div className={eventGridStyles.grid} aria-busy="true" aria-live="polite">
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}
