import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatPct, formatVolume } from "@/shared/lib/format";
import type { HomeHeroModel } from "../selectors";
import styles from "./HeroRightRail.module.css";

type HeroRightRailProps = {
  hero: HomeHeroModel;
};

const formatChangeLabel = (change: number): string =>
  `${change >= 0 ? "+" : "-"}${Math.round(Math.abs(change) * 100)}%`;

const getPulseTitle = (
  item: HomeHeroModel["pulse"][number],
): string => item.market.question || item.event.title || item.label;

export function HeroRightRail({ hero }: HeroRightRailProps) {
  return (
    <aside className={styles.rail} aria-label="Homepage spotlight rail">
      <div className={styles.content}>
        <section
          id="market-pulse"
          className={`${styles.module} ${styles.pulseModule}`.trim()}
          aria-labelledby="market-pulse-heading"
        >
          <div className={styles.headingRow}>
            <h2 id="market-pulse-heading" className={styles.heading}>
              Market pulse
            </h2>
            <ChevronRight size={16} aria-hidden="true" className={styles.chevron} />
          </div>

          <ol className={styles.list}>
            {hero.pulse.map((item, index) => (
              <li key={`${item.event.id}-${item.market.id}`} className={styles.item}>
                <Link href={item.href} className={styles.link}>
                  <span className={styles.rank}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className={styles.body}>
                    <span className={styles.title}>{getPulseTitle(item)}</span>
                  </span>
                  <span className={styles.stats}>
                    <span className={styles.primaryStat}>{formatPct(item.chance)}</span>
                    <span
                      className={item.dayChange >= 0 ? styles.deltaUp : styles.deltaDown}
                    >
                      {formatChangeLabel(item.dayChange)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section
          className={`${styles.module} ${styles.topicModule}`.trim()}
          aria-labelledby="hero-hot-topics"
        >
          <div className={styles.headingRow}>
            <h2 id="hero-hot-topics" className={styles.heading}>
              Hot topics
            </h2>
            <ChevronRight size={16} aria-hidden="true" className={styles.chevron} />
          </div>

          <ol className={styles.list}>
            {hero.topics.map((topic, index) => {
              const content = (
                <>
                  <span className={styles.rank}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className={styles.body}>
                    <span className={styles.title}>{topic.label}</span>
                  </span>
                  <span className={styles.stats}>
                    <span className={styles.primaryStat}>
                      {formatVolume(topic.totalVolume)}
                    </span>
                    <span className={styles.statMeta}>today</span>
                  </span>
                </>
              );

              return (
                <li key={topic.slug} className={styles.item}>
                  {topic.href ? (
                    <Link href={topic.href} className={styles.link}>
                      {content}
                    </Link>
                  ) : (
                    <div className={styles.link}>{content}</div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      <Link href="#markets" className={styles.exploreLink}>
        Explore all
      </Link>
    </aside>
  );
}
