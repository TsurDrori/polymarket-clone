"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bookmark, Link2 } from "lucide-react";
import { getEventImage } from "@/features/events/api/parse";
import { OutcomeActionContent } from "@/features/market-cards/components/OutcomeActionContent";
import { formatPct } from "@/shared/lib/format";
import { shouldBypassNextImageOptimization } from "@/shared/lib/images";
import { isYesNoOutcomeLabel } from "@/shared/lib/outcomes";
import type { HeroChartModel, HeroSpotlightModel } from "../selectors";
import { HeroPriceChart, type HeroChartHoverState } from "./HeroPriceChart";
import styles from "./HomeHero.module.css";

type HeroSpotlightCardProps = {
  spotlight: HeroSpotlightModel;
};

const formatChangeLabel = (change: number): string =>
  `${change >= 0 ? "+" : "-"}${Math.round(Math.abs(change) * 100)}%`;

const spotlightChartCache = new Map<string, HeroChartModel | null>();
const spotlightChartRequestCache = new Map<string, Promise<HeroChartModel | null>>();

const fetchSpotlightChart = async (
  tokenId: string,
): Promise<HeroChartModel | null> => {
  const cachedChart = spotlightChartCache.get(tokenId);

  if (cachedChart !== undefined) {
    return cachedChart;
  }

  const existingRequest = spotlightChartRequestCache.get(tokenId);

  if (existingRequest) {
    return existingRequest;
  }

  const nextRequest = fetch(
    `/api/market-price-history?tokenId=${encodeURIComponent(tokenId)}`,
    {
      method: "GET",
    },
  )
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to load chart for token ${tokenId}`);
      }

      const payload = (await response.json()) as {
        chart?: HeroChartModel | null;
      };

      return payload.chart ?? null;
    })
    .then((chart) => {
      spotlightChartCache.set(tokenId, chart);
      return chart;
    })
    .finally(() => {
      spotlightChartRequestCache.delete(tokenId);
    });

  spotlightChartRequestCache.set(tokenId, nextRequest);

  return nextRequest;
};

export function HeroSpotlightCard({ spotlight }: HeroSpotlightCardProps) {
  const [hoveredPoint, setHoveredPoint] = useState<HeroChartHoverState | null>(null);
  const cachedChart =
    spotlight.chart ??
    (spotlight.tokenId ? spotlightChartCache.get(spotlight.tokenId) ?? null : null);
  const chartKey = spotlight.tokenId ?? spotlight.market.id;
  const [loadedChartState, setLoadedChartState] = useState<{
    key: string;
    chart: HeroChartModel | null;
  }>(() => ({
    key: chartKey,
    chart: cachedChart,
  }));
  const chart =
    loadedChartState.key === chartKey
      ? (spotlight.chart ?? loadedChartState.chart ?? cachedChart)
      : cachedChart;
  const imageSrc = getEventImage(spotlight.event) ?? "/placeholder.svg";
  const sourceRows =
    spotlight.sourceRows.length > 1
      ? [...spotlight.sourceRows, ...spotlight.sourceRows]
      : spotlight.sourceRows;
  const chartStartPoint = chart?.points[0]?.p ?? null;
  const displayChance = spotlight.chance;
  const displayDelta = useMemo(() => {
    if (chartStartPoint === null) {
      return spotlight.dayChange;
    }

    const hoveredDelta = (hoveredPoint?.p ?? spotlight.chance) - chartStartPoint;
    return hoveredDelta;
  }, [chartStartPoint, hoveredPoint?.p, spotlight.chance, spotlight.dayChange]);
  const primaryOutcome = spotlight.outcomeItems[0];
  const secondaryOutcome = spotlight.outcomeItems[1];

  useEffect(() => {
    if (spotlight.chart || !spotlight.tokenId) {
      return;
    }

    let isCancelled = false;
    const activeChartKey = spotlight.tokenId;

    void fetchSpotlightChart(spotlight.tokenId)
      .then((nextChart) => {
        if (!isCancelled) {
          setLoadedChartState((current) =>
            current.key === activeChartKey && current.chart === nextChart
              ? current
              : {
                  key: activeChartKey,
                  chart: nextChart,
                },
          );
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setLoadedChartState((current) =>
            current.key === activeChartKey && current.chart === null
              ? current
              : {
                  key: activeChartKey,
                  chart: null,
                },
          );
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [spotlight.chart, spotlight.tokenId]);

  return (
    <article className={styles.spotlightCard} data-spotlight-card>
      <header className={styles.spotlightHeader}>
        <div className={styles.spotlightIntro}>
          <div className={styles.thumbnailWrap}>
            <Image
              src={imageSrc}
              alt=""
              fill
              sizes="56px"
              unoptimized={shouldBypassNextImageOptimization(imageSrc)}
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
                <span className={styles.spotlightTitleText}>
                  {spotlight.market.question}
                </span>
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
            <div className={styles.spotlightPrice} data-hero-price>
              {formatPct(displayChance)} chance
            </div>
            <span
              className={`${styles.priceDelta} ${
                displayDelta >= 0 ? styles.deltaUp : styles.deltaDown
              }`.trim()}
              data-hero-delta
            >
              {formatChangeLabel(displayDelta)}
            </span>
          </div>

          {spotlight.outcomeMode === "multi-market" ? (
            <div className={styles.marketOutcomeList} data-hero-market-options>
              {spotlight.outcomeItems.map((outcome) => (
                <Link
                  key={outcome.marketId}
                  href={outcome.href}
                  className={styles.marketOutcomeRow}
                >
                  <span className={styles.marketOutcomeLabel}>
                    <span className={styles.marketOutcomeLabelText}>{outcome.label}</span>
                  </span>
                  <span className={styles.marketOutcomeValue}>
                    {formatPct(outcome.chance)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.outcomeRow}>
              {primaryOutcome ? (
                <Link
                  href={primaryOutcome.href}
                  className={`${styles.outcomePill} ${styles.outcomeYes}`}
                  data-hero-outcome-button="yes"
                >
                  <OutcomeActionContent
                    className={styles.outcomePillLabel}
                    label={primaryOutcome.label}
                    tokenId={primaryOutcome.tokenId}
                    fallbackPrice={primaryOutcome.chance}
                    showPriceOnHover={isYesNoOutcomeLabel(primaryOutcome.label)}
                  />
                </Link>
              ) : null}
              {secondaryOutcome ? (
                <Link
                  href={secondaryOutcome.href}
                  className={`${styles.outcomePill} ${styles.outcomeNo}`}
                  data-hero-outcome-button="no"
                >
                  <OutcomeActionContent
                    className={styles.outcomePillLabel}
                    label={secondaryOutcome.label}
                    tokenId={secondaryOutcome.tokenId}
                    fallbackPrice={secondaryOutcome.chance}
                    showPriceOnHover={isYesNoOutcomeLabel(secondaryOutcome.label)}
                  />
                </Link>
              ) : null}
            </div>
          )}

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
                        <span className={styles.sourceHeader} data-source-header>
                          {row.label}
                          {row.meta ? ` · ${row.meta}` : ""}
                        </span>
                        <span className={styles.sourceValue} data-source-value>
                          <span className={styles.sourceValueText}>{row.value}</span>
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <HeroPriceChart
          chart={chart}
          currentChance={spotlight.chance}
          tokenId={spotlight.tokenId}
          bestBid={spotlight.market.bestBid}
          bestAsk={spotlight.market.bestAsk}
          dayChange={spotlight.dayChange}
          onHoverChange={setHoveredPoint}
        />
      </div>

      <footer className={styles.spotlightFooter}>
        <span>{spotlight.volumeLabel} Vol.</span>
        <span>
          {chart?.intervalLabel ?? "Latest snapshot"} ·{" "}
          {chart?.sourceLabel ?? "Polymarket"}
        </span>
      </footer>
    </article>
  );
}
