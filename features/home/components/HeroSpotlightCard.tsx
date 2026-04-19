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
  const sourceRows =
    spotlight.sourceRows.length > 1
      ? [...spotlight.sourceRows, ...spotlight.sourceRows]
      : spotlight.sourceRows;

  return (
    <article className={styles.spotlightCard}>
      <header className={styles.spotlightHeader}>
        <div className={styles.spotlightIntro}>
          <div className={styles.thumbnailWrap}>
            <Image
              src={imageSrc}
              alt=""
              fill
              sizes="56px"
              className={styles.thumbnail}
            />
          </div>

          <div>
            <p className={styles.breadcrumb}>
              <span>{spotlight.categoryLabel}</span>
              {spotlight.subcategoryLabel
                ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{spotlight.subcategoryLabel}</span>
                    </>
                  )
                : ""}
            </p>
            <h1 className={styles.spotlightTitle} data-hero-title>
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

      <div className={styles.spotlightBody}>
        <div className={styles.spotlightCopy}>
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

          <div className={styles.outcomeRow}>
            <Link href={spotlight.href} className={`${styles.outcomePill} ${styles.outcomeYes}`}>
              Yes
            </Link>
            <Link href={spotlight.href} className={`${styles.outcomePill} ${styles.outcomeNo}`}>
              No
            </Link>
          </div>

          <div className={styles.sourceSection}>
            <div className={styles.sourceTicker} data-feed-ticker>
              <ul className={styles.sourceTrack} data-feed-track>
                {sourceRows.map((row, index) => (
                  <li
                    key={`${row.label}-${row.value}-${index}`}
                    className={styles.sourceItem}
                    aria-hidden={index >= spotlight.sourceRows.length}
                  >
                    <Link
                      href={spotlight.href}
                      className={styles.sourceItemLink}
                      tabIndex={index >= spotlight.sourceRows.length ? -1 : undefined}
                    >
                      <span className={styles.sourceBody}>
                        <span className={styles.sourceHeader}>
                          {row.label}
                          {row.meta ? ` · ${row.meta}` : ""}
                        </span>
                        <span className={styles.sourceValue}>{row.value}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
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
