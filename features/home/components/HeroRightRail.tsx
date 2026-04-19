import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatPct, formatVolume } from "@/shared/lib/format";
import type { HomeHeroModel } from "../selectors";
import styles from "./HomeHero.module.css";

type HeroRightRailProps = {
  hero: HomeHeroModel;
};

const formatChangeLabel = (change: number): string =>
  `${change >= 0 ? "+" : "-"}${Math.round(Math.abs(change) * 100)}%`;

export function HeroRightRail({ hero }: HeroRightRailProps) {
  return (
    <aside className={styles.heroRail} aria-label="Homepage spotlight rail">
      <div className={styles.heroRailContent}>
        <section
          id="breaking-news"
          className={styles.railModule}
          aria-labelledby="breaking-news-heading"
        >
          <div className={styles.railHeadingRow}>
            <h2 id="breaking-news-heading" className={styles.railHeading}>
              Breaking news
            </h2>
            <ChevronRight size={18} aria-hidden="true" />
          </div>

          <ol className={styles.railList}>
            {hero.breaking.map((item, index) => (
              <li key={`${item.event.id}-${item.market.id}`}>
                <Link href={item.href} className={styles.railLink}>
                  <span className={styles.railRank}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className={styles.railBody}>
                    <span className={styles.railTitle}>{item.label}</span>
                    <span className={styles.railSubtitle}>{item.event.title}</span>
                  </span>
                  <span className={styles.railStats}>
                    <span className={styles.railChance}>{formatPct(item.chance)}</span>
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

        <section className={styles.railModule} aria-labelledby="hero-hot-topics">
          <div className={styles.railHeadingRow}>
            <h2 id="hero-hot-topics" className={styles.railHeading}>
              Hot topics
            </h2>
            <ChevronRight size={18} aria-hidden="true" />
          </div>

          <ol className={styles.railList}>
            {hero.topics.map((topic, index) => {
              const content = (
                <>
                  <span className={styles.railRank}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className={styles.railBody}>
                    <span className={styles.railTitle}>{topic.label}</span>
                    <span className={styles.railSubtitle}>
                      {topic.eventCount} markets
                    </span>
                  </span>
                  <span className={styles.railStats}>
                    <span className={styles.railVolume}>
                      {formatVolume(topic.totalVolume)}
                    </span>
                    <span className={styles.railHeadingCopy}>today</span>
                  </span>
                </>
              );

              return (
                <li key={topic.slug}>
                  {topic.href ? (
                    <Link href={topic.href} className={styles.railLink}>
                      {content}
                    </Link>
                  ) : (
                    <div className={styles.railLink}>{content}</div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      <Link href="#all-markets" className={styles.exploreLink}>
        Explore all
      </Link>
    </aside>
  );
}
