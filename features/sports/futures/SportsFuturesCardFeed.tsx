"use client";

import { useMemo } from "react";
import { SurfaceFeed } from "@/features/events/feed/SurfaceFeed";
import type {
  SurfaceFeedItem,
  SurfaceFeedLayoutVariant,
} from "@/features/events/feed/types";
import { useProjectedSurfaceWindow } from "@/features/realtime/surfaces/hooks";
import type { SurfaceProjectionPolicy } from "@/features/realtime/surfaces/types";
import { FuturesEventListCard } from "./FuturesEventListCard";
import type { SportsCardModel } from "./parse";
import styles from "./SportsFuturesSurface.module.css";

type SportsFuturesCardFeedProps = {
  cards: ReadonlyArray<SportsCardModel>;
  initialCount?: number;
  incrementCount?: number;
};

const SPORTS_FUTURES_INITIAL_COUNT = 12;
const SPORTS_FUTURES_INCREMENT = 8;
const SPORTS_FUTURES_OVERSCAN = 4;
const SPORTS_FUTURES_REORDER_COOLDOWN_MS = 12_000;
const SPORTS_FUTURES_HIGHLIGHT_MS = 1_800;
const SPORTS_FUTURES_LEADER_COUNT = 3;

const getFuturesFeedItemId = (item: SurfaceFeedItem<SportsCardModel>): string =>
  item.descriptor.id;

const getCardTokenIds = (item: SurfaceFeedItem<SportsCardModel>): string[] =>
  item.model.previewOutcomes.flatMap((preview) =>
    preview.yesTokenId ? [preview.yesTokenId] : [],
  );

const getFuturesLayoutVariant = (
  card: SportsCardModel,
  index: number,
): SurfaceFeedLayoutVariant => {
  if (index === 0 && card.previewOutcomes.length >= 4) {
    return "wide";
  }

  if (card.previewOutcomes.length >= 5) {
    return "wide";
  }

  if (card.previewOutcomes.length >= 3) {
    return "standard";
  }

  return "compact";
};

const getFuturesCardLiveScore = (
  item: SurfaceFeedItem<SportsCardModel>,
  readTick: (tokenId: string) => { price: number },
): number => {
  const cardDelta = Math.max(
    0,
    ...item.model.previewOutcomes.map((preview) => {
      if (!preview.yesTokenId) {
        return 0;
      }

      return Math.abs(readTick(preview.yesTokenId).price - preview.yesFallbackPrice);
    }),
  );
  const eventVolume = item.model.event.volume24hr || item.model.event.volume;
  const volumeBias = Math.min(eventVolume, 5_000_000) / 5_000_000;

  return cardDelta + volumeBias * 0.002;
};

export function SportsFuturesCardFeed({
  cards,
  initialCount = SPORTS_FUTURES_INITIAL_COUNT,
  incrementCount = SPORTS_FUTURES_INCREMENT,
}: SportsFuturesCardFeedProps) {
  const feedItems = useMemo<SurfaceFeedItem<SportsCardModel>[]>(
    () =>
      cards.map((card, index) => ({
        descriptor: {
          id: card.id,
          layoutVariant: getFuturesLayoutVariant(card, index),
          motionPolicy: "bounded-promote",
          renderVariant: "sports-futures-card",
          motionKey: card.previewOutcomes[0]?.id ?? card.id,
        },
        model: card,
      })),
    [cards],
  );
  const projectionPolicy = useMemo<SurfaceProjectionPolicy>(
    () => ({
      initialVisibleCount: Math.min(initialCount, feedItems.length),
      visibleIncrement: incrementCount,
      overscanCount: SPORTS_FUTURES_OVERSCAN,
      maxPromotionsPerCycle: 1,
      reorderCooldownMs: SPORTS_FUTURES_REORDER_COOLDOWN_MS,
      highlightMs: SPORTS_FUTURES_HIGHLIGHT_MS,
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
    getItemId: getFuturesFeedItemId,
    getItemTokenIds: getCardTokenIds,
    getItemLiveScore: getFuturesCardLiveScore,
    policy: projectionPolicy,
  });

  return (
    <SurfaceFeed
      items={visibleItems}
      highlightedIds={highlightedIds}
      leaderIds={leaderIds.slice(0, SPORTS_FUTURES_LEADER_COUNT)}
      continuation={{
        hasMore,
        onContinue: showMore,
      }}
      className={styles.cards}
      renderItem={(item, meta) => (
        <FuturesEventListCard
          card={item.model}
          emphasis={{
            isLiveLeader: meta.isLiveLeader,
            isPromoted: meta.isHighlighted,
          }}
        />
      )}
    />
  );
}
