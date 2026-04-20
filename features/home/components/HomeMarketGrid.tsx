"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bookmark, Gift, Repeat2 } from "lucide-react";
import type { PolymarketEvent, PolymarketMarket } from "@/features/events/types";
import { getEventImage } from "@/features/events/api/parse";
import { ContinuationButton } from "@/shared/ui/ContinuationButton";
import { formatPct, formatVolume } from "@/shared/lib/format";
import { shouldBypassNextImageOptimization } from "@/shared/lib/images";
import { getPrimaryMarket, selectSpotlightMarket } from "../selectors";
import styles from "./HomeMarketGrid.module.css";

type HomeMarketGridProps = {
  events: ReadonlyArray<PolymarketEvent>;
  initialCount?: number;
  incrementCount?: number;
};

const formatShortEndDate = (iso?: string): string => {
  if (!iso) return "";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
  }).format(date);
};

const getDisplayPrice = (market: PolymarketMarket): number =>
  market.lastTradePrice || market.outcomePrices[0] || market.bestBid || 0;

const normalizeOutcomeLabel = (value: string | undefined, fallback: string): string => {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (trimmed.length === 0) return fallback;
  return trimmed.length <= 10 ? trimmed : fallback;
};

const getOutcomeLabels = (market: PolymarketMarket): [string, string] => [
  normalizeOutcomeLabel(market.outcomes[0], "Yes"),
  normalizeOutcomeLabel(market.outcomes[1], "No"),
];

const getMarketRows = (event: PolymarketEvent): PolymarketMarket[] =>
  [...event.markets]
    .sort(
      (left, right) =>
        (right.volume24hr || right.volumeNum) - (left.volume24hr || left.volumeNum),
    )
    .slice(0, 2);

const formatChangeLabel = (change: number): string =>
  `${change >= 0 ? "+" : "-"}${Math.round(Math.abs(change) * 100)}%`;

function HomeMarketCard({ event }: { event: PolymarketEvent }) {
  const imageSrc = getEventImage(event) ?? "/placeholder.svg";
  const href = `/event/${event.slug}`;
  const rowMarkets = getMarketRows(event);
  const primaryMarket = selectSpotlightMarket(event) ?? getPrimaryMarket(event);
  const [primaryYesLabel, primaryNoLabel] = primaryMarket
    ? getOutcomeLabels(primaryMarket)
    : ["Yes", "No"];
  const chance = primaryMarket ? getDisplayPrice(primaryMarket) : 0;
  const isBinary = !event.showAllOutcomes || event.markets.length <= 1;
  const gaugeStyle = {
    "--fill": `${Math.round(chance * 360)}deg`,
  } as CSSProperties;

  return (
    <Link href={href} className={styles.card}>
      <div className={styles.header}>
        <div className={styles.mediaWrap}>
          <Image
            src={imageSrc}
            alt=""
            fill
            sizes="34px"
            unoptimized={shouldBypassNextImageOptimization(imageSrc)}
            className={styles.media}
          />
        </div>

        <h3 className={styles.title}>{event.title}</h3>

        {isBinary ? (
          <div className={styles.gauge} style={gaugeStyle}>
            <div className={styles.gaugeInner}>
              <span className={styles.gaugeValue}>{formatPct(chance)}</span>
              <span className={styles.gaugeLabel}>
                {primaryMarket?.outcomes[0] ?? "chance"}
              </span>
            </div>
          </div>
        ) : (
          <span className={styles.chanceBadge}>{formatPct(chance)} chance</span>
        )}
      </div>

      {isBinary && primaryMarket ? (
        <div className={styles.binaryRow}>
          <div className={styles.binaryDeltaRow}>
            <span
              className={
                primaryMarket.oneDayPriceChange >= 0 ? styles.deltaUp : styles.deltaDown
              }
            >
              {formatChangeLabel(primaryMarket.oneDayPriceChange)}
            </span>
            <span>{primaryMarket.volume24hr ? formatVolume(primaryMarket.volume24hr) : ""}</span>
          </div>

          <div className={styles.binaryOutcomeRow}>
            <span className={`${styles.binaryPill} ${styles.outcomeYes}`}>
              {primaryYesLabel}
            </span>
            <span className={`${styles.binaryPill} ${styles.outcomeNo}`}>
              {primaryNoLabel}
            </span>
          </div>
        </div>
      ) : (
        <div className={styles.rows}>
          {rowMarkets.map((market) => {
            const [yesLabel, noLabel] = getOutcomeLabels(market);

            return (
              <div key={market.id} className={styles.row}>
                <span className={styles.rowLabel}>
                  {formatShortEndDate(market.endDate || event.endDate) ||
                    market.groupItemTitle ||
                    market.question}
                </span>
                <span className={styles.rowChance}>{formatPct(getDisplayPrice(market))}</span>
                <span className={styles.outcomePair}>
                  <span className={`${styles.outcomePill} ${styles.outcomeYes}`}>
                    {yesLabel}
                  </span>
                  <span className={`${styles.outcomePill} ${styles.outcomeNo}`}>
                    {noLabel}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.footer}>
        <span>{formatVolume(event.volume24hr || event.volume)} Vol.</span>
        <span className={styles.footerActions}>
          <Gift size={14} />
          <Repeat2 size={14} />
          <Bookmark size={14} />
        </span>
      </div>
    </Link>
  );
}

export function HomeMarketGrid({
  events,
  initialCount = 12,
  incrementCount = 12,
}: HomeMarketGridProps) {
  const [visibleCount, setVisibleCount] = useState(initialCount);

  const visibleEvents = events.slice(0, visibleCount);
  const hasMore = visibleCount < events.length;

  return (
    <div className={styles.stack}>
      <div className={styles.grid}>
        {visibleEvents.map((event) => (
          <HomeMarketCard key={event.id} event={event} />
        ))}
      </div>

      {hasMore ? (
        <div className={styles.actionRow}>
          <ContinuationButton
            onClick={() =>
              setVisibleCount((count) => Math.min(events.length, count + incrementCount))
            }
          >
            Show more markets
          </ContinuationButton>
        </div>
      ) : null}
    </div>
  );
}
