import Image from "next/image";
import Link from "next/link";
import { Bookmark, Link2 } from "lucide-react";
import { getEventImage } from "@/features/events/api/parse";
import { PriceCell } from "@/features/events/components/PriceCell";
import { formatPct } from "@/shared/lib/format";
import type { HeroSpotlightModel } from "../selectors";
import { HeroPriceChart } from "./HeroPriceChart";
import styles from "./HomeHero.module.css";

type HeroSpotlightCardProps = {
  spotlight: HeroSpotlightModel;
};

const formatChangeLabel = (change: number): string =>
  `${change >= 0 ? "+" : "-"}${Math.round(Math.abs(change) * 100)}%`;

export function HeroSpotlightCard({ spotlight }: HeroSpotlightCardProps) {
  const imageSrc = getEventImage(spotlight.event) ?? "/placeholder.svg";
  const summary = spotlight.summary || spotlight.headline;

  return (
    <article className={styles.spotlightCard}>
      <header className={styles.spotlightHeader}>
        <div className={styles.spotlightIntro}>
          <div className={styles.thumbnailWrap}>
            <Image
              src={imageSrc}
              alt=""
              fill
              sizes="48px"
              className={styles.thumbnail}
            />
          </div>

          <div>
            <p className={styles.breadcrumb}>
              {spotlight.categoryLabel}
              {spotlight.subcategoryLabel
                ? ` · ${spotlight.subcategoryLabel}`
                : ""}
            </p>
            <h1 className={styles.spotlightTitle}>
              <Link href={spotlight.href} className={styles.spotlightTitleLink}>
                {spotlight.market.question}
              </Link>
            </h1>
          </div>
        </div>

        <div className={styles.utilityIcons} aria-hidden="true">
          <span className={styles.utilityIcon}>
            <Link2 size={16} />
          </span>
          <span className={styles.utilityIcon}>
            <Bookmark size={16} />
          </span>
        </div>
      </header>

      <div className={styles.priceRow}>
        <div className={styles.spotlightPrice}>
          {spotlight.tokenId ? (
            <PriceCell tokenId={spotlight.tokenId} formatKind="pct" />
          ) : (
            formatPct(spotlight.chance)
          )}{" "}
          chance
        </div>
        <span
          className={`${styles.priceDelta} ${
            spotlight.dayChange >= 0 ? styles.deltaUp : styles.deltaDown
          }`.trim()}
        >
          {formatChangeLabel(spotlight.dayChange)}
        </span>
      </div>

      <div className={styles.spotlightBody}>
        <div className={styles.spotlightCopy}>
          <div className={styles.outcomeRow}>
            <Link href={spotlight.href} className={`${styles.outcomePill} ${styles.outcomeYes}`}>
              Yes
            </Link>
            <Link href={spotlight.href} className={`${styles.outcomePill} ${styles.outcomeNo}`}>
              No
            </Link>
          </div>

          <p className={styles.summary}>{summary}</p>

          <div className={styles.sourceSection}>
            <span className={styles.sourceMeta}>Derived market context</span>
            <ul className={styles.sourceList}>
              {spotlight.sourceRows.map((row) => (
                <li key={`${row.label}-${row.value}`} className={styles.sourceItem}>
                  <div className={styles.sourceBody}>
                    <span className={styles.sourceHeader}>
                      <span className={styles.sourceLabel}>{row.label}</span>
                      {row.meta ? (
                        <span className={styles.sourceMetaText}>{row.meta}</span>
                      ) : null}
                    </span>
                    <span className={styles.sourceValue}>{row.value}</span>
                  </div>
                  {row.stat ? (
                    <span
                      className={`${styles.sourceStat} ${
                        row.statTone === "up"
                          ? styles.sourceStatUp
                          : row.statTone === "down"
                            ? styles.sourceStatDown
                            : ""
                      }`.trim()}
                    >
                      {row.stat}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <HeroPriceChart
          chart={spotlight.chart}
          currentChance={spotlight.chance}
        />
      </div>

      <footer className={styles.spotlightFooter}>
        <span>{spotlight.volumeLabel} Vol.</span>
        <span>
          {spotlight.chart?.intervalLabel ?? "Latest snapshot"} ·{" "}
          {spotlight.chart?.sourceLabel ?? "Polymarket"}
        </span>
      </footer>
    </article>
  );
}
