"use client";

import { useMemo } from "react";
import { SurfaceFeed } from "@/features/events/feed/SurfaceFeed";
import type { SurfaceFeedItem } from "@/features/events/feed/types";
import { useProjectedSurfaceWindow } from "@/features/realtime/surfaces/hooks";
import type { SurfaceProjectionPolicy } from "@/features/realtime/surfaces/types";
import { CryptoCard } from "./CryptoCard";
import styles from "./CryptoCardGrid.module.css";
import {
  CRYPTO_OVERSCAN_COUNT,
  type CryptoCardModel,
  type CryptoCardSnippet,
} from "../parse";

type CryptoCardGridProps = {
  cards: ReadonlyArray<CryptoCardModel>;
  initialCount?: number;
  incrementCount?: number;
  continuationLabel?: string;
};

const CRYPTO_REORDER_COOLDOWN_MS = 12_000;
const CRYPTO_HIGHLIGHT_MS = 2_000;
const CRYPTO_LEAD_CARD_COUNT = 3;
const getCryptoFeedItemId = (item: SurfaceFeedItem<CryptoCardModel>): string =>
  item.descriptor.id;
const getCryptoCardTokenIds = (item: SurfaceFeedItem<CryptoCardModel>): string[] =>
  item.model.snippets.flatMap((snippet) => (snippet.tokenId ? [snippet.tokenId] : []));

const getSnippetLiveDelta = (
  snippet: CryptoCardSnippet,
  readPrice: (tokenId: string) => number,
): number => {
  if (!snippet.tokenId) {
    return 0;
  }

  return Math.abs(readPrice(snippet.tokenId) - snippet.fallbackPrice);
};

const getCryptoCardLiveScore = (
  item: SurfaceFeedItem<CryptoCardModel>,
  readPrice: (tokenId: string) => number,
): number => {
  const card = item.model;
  const primaryDelta = getSnippetLiveDelta(card.primarySnippet, readPrice);
  const secondaryDelta = Math.max(
    0,
    ...card.snippets.map((snippet) => getSnippetLiveDelta(snippet, readPrice)),
  );
  const motionDelta = Math.max(primaryDelta, secondaryDelta);
  const volume = card.sortVolume;
  const volumeBias = Math.min(volume, 1_000_000) / 1_000_000;
  const singleCardBias = card.variant === "single" ? 0.01 : 0;

  return motionDelta + volumeBias * 0.001 + singleCardBias;
};

const getCryptoCardProjectionScore = (
  item: SurfaceFeedItem<CryptoCardModel>,
  readTick: (tokenId: string) => { price: number },
): number =>
  getCryptoCardLiveScore(item, (tokenId) => readTick(tokenId).price);

export function CryptoCardGrid({
  cards,
  initialCount,
  incrementCount,
  continuationLabel = "Show more markets",
}: CryptoCardGridProps) {
  const feedItems = useMemo<SurfaceFeedItem<CryptoCardModel>[]>(
    () =>
      cards.map((card) => ({
        descriptor: {
          id: card.id,
          layoutVariant: "standard",
          layout: {
            base: 12,
            sm: 6,
            md: 6,
            lg: 6,
            xl: 4,
          },
          motionPolicy: "bounded-promote",
          motionKey: card.primarySnippet.id,
          renderVariant: `crypto-${card.variant}`,
        },
        model: card,
      })),
    [cards],
  );
  const projectionPolicy = useMemo<SurfaceProjectionPolicy>(
    () => ({
      initialVisibleCount:
        typeof initialCount === "number" && initialCount > 0
          ? initialCount
          : feedItems.length,
      visibleIncrement:
        typeof incrementCount === "number" && incrementCount > 0
          ? incrementCount
          : feedItems.length,
      overscanCount: CRYPTO_OVERSCAN_COUNT,
      maxPromotionsPerCycle: 1,
      reorderCooldownMs: CRYPTO_REORDER_COOLDOWN_MS,
      highlightMs: CRYPTO_HIGHLIGHT_MS,
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
    getItemId: getCryptoFeedItemId,
    getItemTokenIds: getCryptoCardTokenIds,
    getItemLiveScore: getCryptoCardProjectionScore,
    policy: projectionPolicy,
  });
  const liveLeaderIdSet = useMemo(
    () =>
      new Set(
        leaderIds
          .map((id) => visibleItems.find((item) => item.descriptor.id === id))
          .filter((item): item is SurfaceFeedItem<CryptoCardModel> => item !== undefined)
          .filter((item) => item.model.variant === "single")
          .slice(0, CRYPTO_LEAD_CARD_COUNT)
          .map((item) => item.descriptor.id),
      ),
    [leaderIds, visibleItems],
  );

  return (
    <SurfaceFeed
      items={visibleItems}
      highlightedIds={highlightedIds}
      leaderIds={[...liveLeaderIdSet]}
      continuation={{
        hasMore,
        onContinue: showMore,
        label: continuationLabel,
      }}
      className={styles.stack}
      gridClassName={styles.grid}
      actionRowClassName={styles.actionRow}
      renderItem={(item, meta) => (
        <CryptoCard
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
