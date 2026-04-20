"use client";

import type { CSSProperties, ReactNode } from "react";
import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bookmark, Gift, Repeat2 } from "lucide-react";
import { PriceCell } from "@/features/events/components/PriceCell";
import { SurfaceFeed } from "@/features/events/feed/SurfaceFeed";
import type {
  SurfaceFeedItem,
  SurfaceFeedLayoutVariant,
} from "@/features/events/feed/types";
import { getEventImage } from "@/features/events/api/parse";
import { useFlash, useLivePrice } from "@/features/realtime/hooks";
import { useProjectedSurfaceWindow } from "@/features/realtime/surfaces/hooks";
import type { SurfaceProjectionPolicy } from "@/features/realtime/surfaces/types";
import type { PolymarketEvent, PolymarketMarket } from "@/features/events/types";
import { cn } from "@/shared/lib/cn";
import { formatPct, formatVolume } from "@/shared/lib/format";
import { shouldBypassNextImageOptimization } from "@/shared/lib/images";
import { getPrimaryMarket, selectSpotlightMarket } from "../selectors";
import styles from "./HomeMarketGrid.module.css";

type HomeMarketGridProps = {
  events: ReadonlyArray<PolymarketEvent>;
  initialCount?: number;
  incrementCount?: number;
};

type HomeMarketCardProps = {
  event: PolymarketEvent;
  emphasis?: {
    isLiveLeader?: boolean;
    isPromoted?: boolean;
  };
  layoutVariant: SurfaceFeedLayoutVariant;
};

const HOME_OVERSCAN_COUNT = 6;
const HOME_REORDER_COOLDOWN_MS = 10_000;
const HOME_HIGHLIGHT_MS = 1_800;
const HOME_LEADER_COUNT = 4;

const formatShortEndDate = (iso?: string): string => {
  if (!iso) return "";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
  }).format(date);
};

const clampPrice = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
};

const getDisplayPrice = (market: PolymarketMarket): number =>
  clampPrice(market.lastTradePrice || market.outcomePrices[0] || market.bestBid || 0);

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

const getPrimaryLiveMarket = (event: PolymarketEvent): PolymarketMarket | undefined =>
  selectSpotlightMarket(event) ?? getPrimaryMarket(event);

const getHomeCardTokenIds = (item: SurfaceFeedItem<PolymarketEvent>): string[] => {
  const tokenIds = new Set<string>();
  const primaryMarket = getPrimaryLiveMarket(item.model);
  const primaryTokenId = primaryMarket?.clobTokenIds[0];

  if (primaryTokenId) {
    tokenIds.add(primaryTokenId);
  }

  for (const market of getMarketRows(item.model)) {
    const tokenId = market.clobTokenIds[0];
    if (tokenId) {
      tokenIds.add(tokenId);
    }
  }

  return [...tokenIds];
};

const getTokenDelta = (
  tokenId: string | undefined,
  fallbackPrice: number,
  readPrice: (tokenId: string) => number,
): number => {
  if (!tokenId) {
    return 0;
  }

  return Math.abs(readPrice(tokenId) - fallbackPrice);
};

const getHomeCardLiveScore = (
  item: SurfaceFeedItem<PolymarketEvent>,
  readTick: (tokenId: string) => { price: number },
): number => {
  const primaryMarket = getPrimaryLiveMarket(item.model);
  const primaryDelta = getTokenDelta(
    primaryMarket?.clobTokenIds[0],
    primaryMarket ? getDisplayPrice(primaryMarket) : 0,
    (tokenId) => readTick(tokenId).price,
  );
  const rowDelta = Math.max(
    0,
    ...getMarketRows(item.model).map((market) =>
      getTokenDelta(
        market.clobTokenIds[0],
        getDisplayPrice(market),
        (tokenId) => readTick(tokenId).price,
      ),
    ),
  );
  const volumeBias = Math.min(item.model.volume24hr || item.model.volume, 5_000_000) / 5_000_000;
  const multiBias = item.model.showAllOutcomes && item.model.markets.length > 1 ? 0.01 : 0;

  return Math.max(primaryDelta, rowDelta) + volumeBias * 0.002 + multiBias;
};

const getHomeLayoutVariant = (
  event: PolymarketEvent,
  index: number,
): SurfaceFeedLayoutVariant => {
  const hasGroupedMarkets = event.showAllOutcomes && event.markets.length > 1;
  const volume = event.volume24hr || event.volume;

  if (index === 0 && hasGroupedMarkets) {
    return "wide";
  }

  if (hasGroupedMarkets && event.markets.length >= 4) {
    return "wide";
  }

  if (volume >= 2_000_000 || hasGroupedMarkets) {
    return "standard";
  }

  return "compact";
};

const getHomeFeedItemId = (item: SurfaceFeedItem<PolymarketEvent>): string => item.descriptor.id;

function LiveGauge({
  fallbackPrice,
  label,
  flashDirection,
  value,
}: {
  fallbackPrice: number;
  flashDirection?: "up" | "down" | null;
  label: string;
  value?: ReactNode;
}) {
  const gaugeStyle = {
    "--fill": `${Math.round(fallbackPrice * 360)}deg`,
  } as CSSProperties;

  return (
    <div
      className={cn(
        styles.gauge,
        flashDirection === "up" && styles.flashUp,
        flashDirection === "down" && styles.flashDown,
      )}
      style={gaugeStyle}
    >
      <div className={styles.gaugeInner}>
        {value ?? <span className={styles.gaugeValue}>{formatPct(fallbackPrice)}</span>}
        <span className={styles.gaugeLabel}>{label}</span>
      </div>
    </div>
  );
}

function StaticGauge({
  fallbackPrice,
  label,
}: {
  fallbackPrice: number;
  label: string;
}) {
  return (
    <LiveGauge
      fallbackPrice={fallbackPrice}
      label={label}
      value={<span className={styles.gaugeValue}>{formatPct(fallbackPrice)}</span>}
    />
  );
}

function TokenGauge({
  tokenId,
  fallbackPrice,
  label,
}: {
  tokenId: string;
  fallbackPrice: number;
  label: string;
}) {
  const tick = useLivePrice(tokenId);
  const flash = useFlash(tokenId);
  const resolvedPrice = tick.ts > 0 ? clampPrice(tick.price) : fallbackPrice;

  return (
    <LiveGauge
      fallbackPrice={resolvedPrice}
      label={label}
      flashDirection={flash.dir}
      value={<PriceCell tokenId={tokenId} formatKind="pct" fallbackValue={fallbackPrice} />}
    />
  );
}

function HomeMarketCard({
  event,
  emphasis,
  layoutVariant,
}: HomeMarketCardProps) {
  const imageSrc = getEventImage(event) ?? "/placeholder.svg";
  const href = `/event/${event.slug}`;
  const rowMarkets = getMarketRows(event);
  const primaryMarket = getPrimaryLiveMarket(event);
  const [primaryYesLabel, primaryNoLabel] = primaryMarket
    ? getOutcomeLabels(primaryMarket)
    : ["Yes", "No"];
  const chance = primaryMarket ? getDisplayPrice(primaryMarket) : 0;
  const primaryTokenId = primaryMarket?.clobTokenIds[0];
  const isBinary = !event.showAllOutcomes || event.markets.length <= 1;

  return (
    <Link
      href={href}
      className={cn(
        styles.card,
        emphasis?.isLiveLeader && styles.cardLeader,
        emphasis?.isPromoted && styles.cardPromoted,
        layoutVariant === "wide" && styles.cardWide,
        layoutVariant === "compact" && styles.cardCompact,
      )}
    >
      <div className={styles.header}>
        <div className={styles.titleRow}>
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

          <div className={styles.titleStack}>
            <h3 className={styles.title}>{event.title}</h3>
            {emphasis?.isLiveLeader ? (
              <span className={styles.liveBadge}>Live</span>
            ) : null}
          </div>
        </div>

        {isBinary ? (
          primaryTokenId
            ? (
                <TokenGauge
                  tokenId={primaryTokenId}
                  fallbackPrice={chance}
                  label={primaryMarket?.outcomes[0] ?? "chance"}
                />
              )
            : (
                <StaticGauge
                  fallbackPrice={chance}
                  label={primaryMarket?.outcomes[0] ?? "chance"}
                />
              )
        ) : (
          <span className={styles.chanceBadge}>
            {primaryTokenId ? (
              <PriceCell
                tokenId={primaryTokenId}
                formatKind="pct"
                fallbackValue={chance}
              />
            ) : (
              formatPct(chance)
            )}{" "}
            chance
          </span>
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
            const rowTokenId = market.clobTokenIds[0];

            return (
              <div key={market.id} className={styles.row}>
                <span className={styles.rowLabel}>
                  {formatShortEndDate(market.endDate || event.endDate) ||
                    market.groupItemTitle ||
                    market.question}
                </span>
                <span className={styles.rowChance}>
                  {rowTokenId ? (
                    <PriceCell
                      tokenId={rowTokenId}
                      formatKind="pct"
                      fallbackValue={getDisplayPrice(market)}
                    />
                  ) : (
                    formatPct(getDisplayPrice(market))
                  )}
                </span>
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
  const feedItems = useMemo<SurfaceFeedItem<PolymarketEvent>[]>(
    () =>
      events.map((event, index) => ({
        descriptor: {
          id: event.id,
          layoutVariant: getHomeLayoutVariant(event, index),
          motionPolicy: "bounded-promote",
          renderVariant: "home-market-card",
          motionKey: getPrimaryLiveMarket(event)?.id ?? event.id,
        },
        model: event,
      })),
    [events],
  );
  const projectionPolicy = useMemo<SurfaceProjectionPolicy>(
    () => ({
      initialVisibleCount: Math.min(initialCount, feedItems.length),
      visibleIncrement: incrementCount,
      overscanCount: HOME_OVERSCAN_COUNT,
      maxPromotionsPerCycle: 1,
      reorderCooldownMs: HOME_REORDER_COOLDOWN_MS,
      highlightMs: HOME_HIGHLIGHT_MS,
    }),
    [feedItems.length, incrementCount, initialCount],
  );
  const {
    visibleItems,
    leaderIds,
    highlightedIds,
    hasMore,
    showMore,
  } = useProjectedSurfaceWindow({
    items: feedItems,
    getItemId: getHomeFeedItemId,
    getItemTokenIds: getHomeCardTokenIds,
    getItemLiveScore: getHomeCardLiveScore,
    policy: projectionPolicy,
  });
  const liveLeaderIds = useMemo(
    () => leaderIds.slice(0, HOME_LEADER_COUNT),
    [leaderIds],
  );

  return (
    <SurfaceFeed
      items={visibleItems}
      highlightedIds={highlightedIds}
      leaderIds={liveLeaderIds}
      continuation={{
        hasMore,
        onContinue: showMore,
      }}
      className={styles.stack}
      gridClassName={styles.grid}
      actionRowClassName={styles.actionRow}
      renderItem={(item, meta) => (
        <HomeMarketCard
          event={item.model}
          layoutVariant={item.descriptor.layoutVariant}
          emphasis={{
            isLiveLeader: meta.isLiveLeader,
            isPromoted: meta.isHighlighted,
          }}
        />
      )}
    />
  );
}
