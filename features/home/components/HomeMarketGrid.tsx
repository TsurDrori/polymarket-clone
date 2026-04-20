"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bookmark, Link2 } from "lucide-react";
import { PriceCell } from "@/features/events/components/PriceCell";
import { SurfaceFeed } from "@/features/events/feed/SurfaceFeed";
import type {
  SurfaceFeedItem,
  SurfaceFeedLayoutVariant,
} from "@/features/events/feed/types";
import { getEventImage } from "@/features/events/api/parse";
import { useProjectedSurfaceWindow } from "@/features/realtime/surfaces/hooks";
import type { SurfaceProjectionPolicy } from "@/features/realtime/surfaces/types";
import type { PolymarketEvent, PolymarketMarket } from "@/features/events/types";
import { cn } from "@/shared/lib/cn";
import { formatPct, formatVolume } from "@/shared/lib/format";
import { shouldBypassNextImageOptimization } from "@/shared/lib/images";
import { getVisibleTags } from "@/shared/lib/tags";
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

type MarketRowModel = {
  id: string;
  label: string;
  price: number;
  tokenId?: string;
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
    month: "short",
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
  return trimmed.length <= 14 ? trimmed : fallback;
};

const getOutcomeLabels = (market: PolymarketMarket): [string, string] => [
  normalizeOutcomeLabel(market.outcomes[0], "Yes"),
  normalizeOutcomeLabel(market.outcomes[1], "No"),
];

const isMarketVisible = (market: PolymarketMarket): boolean => !market.closed;

const getMarketRows = (event: PolymarketEvent): PolymarketMarket[] => {
  const visibleMarkets = event.markets.filter(isMarketVisible);

  if (visibleMarkets.length === 0) {
    return event.markets.slice(0, 3);
  }

  return visibleMarkets.slice(0, 3);
};

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

const getEventMeta = (event: PolymarketEvent): { category: string; subcategory?: string } => {
  const [primaryTag, secondaryTag] = getVisibleTags(event);

  return {
    category: primaryTag?.label || "Trending",
    subcategory: secondaryTag?.label,
  };
};

const getBinaryRowModel = (
  market: PolymarketMarket,
  event: PolymarketEvent,
): MarketRowModel => ({
  id: market.id,
  label: formatShortEndDate(market.endDate || event.endDate) || "Chance",
  price: getDisplayPrice(market),
  tokenId: market.clobTokenIds[0],
});

const getGroupedRowModel = (
  market: PolymarketMarket,
  event: PolymarketEvent,
): MarketRowModel => ({
  id: market.id,
  label:
    market.groupItemTitle ||
    formatShortEndDate(market.endDate || event.endDate) ||
    market.question,
  price: getDisplayPrice(market),
  tokenId: market.clobTokenIds[0],
});

function HomeMarketCard({
  event,
  emphasis,
  layoutVariant,
}: HomeMarketCardProps) {
  const imageSrc = getEventImage(event) ?? "/placeholder.svg";
  const href = `/event/${event.slug}`;
  const primaryMarket = getPrimaryLiveMarket(event);
  const rowMarkets = getMarketRows(event);
  const rows = rowMarkets.map((market) =>
    event.showAllOutcomes && event.markets.length > 1
      ? getGroupedRowModel(market, event)
      : getBinaryRowModel(market, event),
  );
  const [yesLabel, noLabel] = primaryMarket ? getOutcomeLabels(primaryMarket) : ["Yes", "No"];
  const primaryPrice = primaryMarket ? getDisplayPrice(primaryMarket) : 0;
  const primaryTokenId = primaryMarket?.clobTokenIds[0];
  const meta = getEventMeta(event);
  const isGrouped = event.showAllOutcomes && event.markets.length > 1;
  const volumeLabel = formatVolume(event.volume24hr || event.volume);
  const endDateLabel = formatShortEndDate(primaryMarket?.endDate || event.endDate);
  const changeLabel = primaryMarket ? formatChangeLabel(primaryMarket.oneDayPriceChange) : null;
  const noPrice = clampPrice(1 - primaryPrice);

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
              sizes="44px"
              unoptimized={shouldBypassNextImageOptimization(imageSrc)}
              className={styles.media}
            />
          </div>

          <div className={styles.titleStack}>
            <div className={styles.metaRow}>
              <span>{meta.category}</span>
              {meta.subcategory ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{meta.subcategory}</span>
                </>
              ) : null}
              {emphasis?.isLiveLeader ? (
                <span className={styles.liveBadge}>Live</span>
              ) : null}
            </div>
            <h3 className={styles.title}>{event.title}</h3>
          </div>
        </div>

        <div className={styles.utilityIcons} aria-hidden="true">
          <Link2 size={15} />
          <Bookmark size={15} />
        </div>
      </div>

      <div className={styles.priceRow}>
        <div className={styles.priceStack}>
          <span className={styles.priceValue}>
            {primaryTokenId ? (
              <PriceCell
                tokenId={primaryTokenId}
                formatKind="pct"
                fallbackValue={primaryPrice}
              />
            ) : (
              formatPct(primaryPrice)
            )}
          </span>
          <span className={styles.priceLabel}>chance</span>
          {changeLabel ? (
            <span
              className={cn(
                styles.changeLabel,
                (primaryMarket?.oneDayPriceChange ?? 0) >= 0
                  ? styles.changeUp
                  : styles.changeDown,
              )}
            >
              {changeLabel}
            </span>
          ) : null}
        </div>

        <div className={styles.marketMeta}>
          {endDateLabel ? <span>{endDateLabel}</span> : null}
          <span>{volumeLabel} Vol.</span>
        </div>
      </div>

      {isGrouped ? (
        <div className={styles.rows}>
          {rows.map((row) => (
            <div key={row.id} className={styles.row}>
              <span className={styles.rowLabel}>{row.label}</span>
              <span className={styles.rowValue}>
                {row.tokenId ? (
                  <PriceCell
                    tokenId={row.tokenId}
                    formatKind="pct"
                    fallbackValue={row.price}
                  />
                ) : (
                  formatPct(row.price)
                )}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.binaryActions}>
          <span className={cn(styles.actionPill, styles.actionYes)}>
            <span>{yesLabel}</span>
            <span>{formatPct(primaryPrice)}</span>
          </span>
          <span className={cn(styles.actionPill, styles.actionNo)}>
            <span>{noLabel}</span>
            <span>{formatPct(noPrice)}</span>
          </span>
        </div>
      )}
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
