import Image from "next/image";
import type { SportsRowCompetitor } from "./parse";
import styles from "./CompetitorsCell.module.css";

type CompetitorsCellProps = {
  competitors: ReadonlyArray<SportsRowCompetitor>;
};

export function CompetitorsCell({ competitors }: CompetitorsCellProps) {
  return (
    <div className={styles.cell}>
      {competitors.map((competitor) => (
        <div key={competitor.key} className={styles.team}>
          {competitor.logo ? (
            <Image
              src={competitor.logo}
              alt=""
              width={28}
              height={28}
              className={styles.logo}
            />
          ) : (
            <span className={styles.fallbackLogo} aria-hidden="true">
              {competitor.abbreviation.slice(0, 1)}
            </span>
          )}

          <div className={styles.copy}>
            <span className={styles.name}>{competitor.name}</span>
            {competitor.record ? (
              <span className={styles.record}>{competitor.record}</span>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
