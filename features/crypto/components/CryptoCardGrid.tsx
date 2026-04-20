"use client";

import { useMemo } from "react";
import { useProjectedSurfaceWindow } from "@/features/realtime/surfaces/hooks";
import type { SurfaceProjectionPolicy } from "@/features/realtime/surfaces/types";
import { ContinuationButton } from "@/shared/ui/ContinuationButton";
import { CryptoCard } from "./CryptoCard";
import styles from "./CryptoCardGrid.module.css";
import type { CryptoCardModel, CryptoCardSnippet } from "../parse";

type CryptoCardGridProps = {
  cards: ReadonlyArray<CryptoCardModel>;
  initialCount?: number;
  incrementCount?: number;
  continuationLabel?: string;
};

const CRYPTO_OVERSCAN_COUNT = 8;
const CRYPTO_REORDER_COOLDOWN_MS = 12_000;
const CRYPTO_HIGHLIGHT_MS = 2_000;
const CRYPTO_LEAD_CARD_COUNT = 3;
const getCryptoCardId = (card: CryptoCardModel): string => card.id;
const getCryptoCardTokenIds = (card: CryptoCardModel): string[] =>
  card.snippets.flatMap((snippet) => (snippet.tokenId ? [snippet.tokenId] : []));

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
  card: CryptoCardModel,
  readPrice: (tokenId: string) => number,
): number => {
  const primaryDelta = getSnippetLiveDelta(card.primarySnippet, readPrice);
  const secondaryDelta = Math.max(
    0,
    ...card.snippets.map((snippet) => getSnippetLiveDelta(snippet, readPrice)),
  );
  const motionDelta = Math.max(primaryDelta, secondaryDelta);
  const volume = card.event.volume24hr || card.event.volume || 0;
  const volumeBias = Math.min(volume, 1_000_000) / 1_000_000;
  const singleCardBias = card.variant === "single" ? 0.01 : 0;

  return motionDelta + volumeBias * 0.001 + singleCardBias;
};

const getCryptoCardProjectionScore = (
  card: CryptoCardModel,
  readTick: (tokenId: string) => { price: number },
): number =>
  getCryptoCardLiveScore(card, (tokenId) => readTick(tokenId).price);

export function CryptoCardGrid({
  cards,
  initialCount,
  incrementCount,
  continuationLabel = "Show more markets",
}: CryptoCardGridProps) {
  const projectionPolicy = useMemo<SurfaceProjectionPolicy>(
    () => ({
      initialVisibleCount:
        typeof initialCount === "number" && initialCount > 0
          ? initialCount
          : cards.length,
      visibleIncrement:
        typeof incrementCount === "number" && incrementCount > 0
          ? incrementCount
          : cards.length,
      overscanCount: CRYPTO_OVERSCAN_COUNT,
      maxPromotionsPerCycle: 1,
      reorderCooldownMs: CRYPTO_REORDER_COOLDOWN_MS,
      highlightMs: CRYPTO_HIGHLIGHT_MS,
    }),
    [cards.length, incrementCount, initialCount],
  );
  const {
    visibleItems,
    leaderIds,
    highlightedIds,
    hasMore,
    showMore,
  } = useProjectedSurfaceWindow({
    items: cards,
    getItemId: getCryptoCardId,
    getItemTokenIds: getCryptoCardTokenIds,
    getItemLiveScore: getCryptoCardProjectionScore,
    policy: projectionPolicy,
  });
  const highlightedIdSet = useMemo(() => new Set(highlightedIds), [highlightedIds]);
  const liveLeaderIdSet = useMemo(
    () =>
      new Set(
        leaderIds
          .map((id) => visibleItems.find((card) => card.id === id))
          .filter((card): card is CryptoCardModel => card !== undefined)
          .filter((card) => card.variant === "single")
          .slice(0, CRYPTO_LEAD_CARD_COUNT)
          .map((card) => card.id),
      ),
    [leaderIds, visibleItems],
  );

  return (
    <div className={styles.stack}>
      <div className={styles.grid}>
        {visibleItems.map((card) => (
          <CryptoCard
            key={card.id}
            card={card}
            emphasis={{
              isLiveLeader: liveLeaderIdSet.has(card.id),
              isPromoted: highlightedIdSet.has(card.id),
            }}
          />
        ))}
      </div>

      {hasMore ? (
        <div className={styles.actionRow}>
          <ContinuationButton onClick={showMore}>
            {continuationLabel}
          </ContinuationButton>
        </div>
      ) : null}
    </div>
  );
}
