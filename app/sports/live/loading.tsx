import { Skeleton } from "@/shared/ui/Skeleton";
import pageStyles from "./page.module.css";
import styles from "./loading.module.css";

const SECTION_IDS = ["nba", "ucl", "nhl"];
const ROW_IDS = ["a", "b", "c"];

export default function SportsLiveLoading() {
  return (
    <main className={pageStyles.main}>
      <section className={styles.surface} aria-busy="true" aria-live="polite">
        <div className={styles.switchRow}>
          <Skeleton className={styles.switchPill} />
          <Skeleton className={styles.switchPillMuted} />
        </div>

        <div className={styles.header}>
          <Skeleton className={styles.title} />
          <Skeleton className={styles.copy} />
        </div>

        <div className={styles.rail}>
          <Skeleton className={styles.chipWide} />
          <Skeleton className={styles.chip} />
          <Skeleton className={styles.chip} />
          <Skeleton className={styles.chip} />
          <Skeleton className={styles.chipWide} />
        </div>

        <div className={styles.sections}>
          {SECTION_IDS.map((sectionId) => (
            <section key={sectionId} className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <Skeleton className={styles.sectionTitle} />
                  <Skeleton className={styles.sectionMeta} />
                </div>
                <Skeleton className={styles.link} />
              </div>

              <div className={styles.tableHeader}>
                <span>Game</span>
                <span>Moneyline</span>
                <span>Spread</span>
                <span>Total</span>
              </div>

              <div className={styles.rows}>
                {ROW_IDS.map((rowId) => (
                  <div key={`${sectionId}-${rowId}`} className={styles.row}>
                    <div className={styles.statusCell}>
                      <Skeleton className={styles.statusLine} />
                      <Skeleton className={styles.statusLineShort} />
                      <Skeleton className={styles.statusLineWide} />
                    </div>

                    <div className={styles.teamsCell}>
                      <div className={styles.teamLine}>
                        <Skeleton className={styles.logo} />
                        <Skeleton className={styles.teamText} />
                      </div>
                      <div className={styles.teamLine}>
                        <Skeleton className={styles.logo} />
                        <Skeleton className={styles.teamText} />
                      </div>
                    </div>

                    <div className={styles.marketCell}>
                      <Skeleton className={styles.marketLine} />
                      <Skeleton className={styles.marketLine} />
                    </div>

                    <div className={styles.marketCell}>
                      <Skeleton className={styles.marketLine} />
                      <Skeleton className={styles.marketLine} />
                    </div>

                    <div className={styles.marketCell}>
                      <Skeleton className={styles.marketLine} />
                      <Skeleton className={styles.marketLine} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
