"use client";

import { useMemo } from "react";
import { SurfaceFeed } from "@/features/events/feed/SurfaceFeed";
import type {
  SurfaceFeedItem,
  SurfaceFeedLayoutVariant,
} from "@/features/events/feed/types";
import { useProjectedSurfaceWindow } from "@/features/realtime/surfaces/hooks";
import type { SurfaceProjectionPolicy } from "@/features/realtime/surfaces/types";
import { HomeMarketCard } from "./HomeMarketCard";
import {
  type HomeCardEntry,
  getHomeCardLiveScore,
  getHomeCardTokenIds,
} from "./homeCardModel";
import styles from "./HomeMarketGrid.module.css";

type HomeMarketGridProps = {
  items: ReadonlyArray<HomeCardEntry>;
  initialCount?: number;
  incrementCount?: number;
  continuation?: {
    hasMore: boolean;
    disabled?: boolean;
    label?: string;
    onContinue: () => void;
  };
};

const HOME_OVERSCAN_COUNT = 6;
const HOME_REORDER_COOLDOWN_MS = 10_000;
const HOME_HIGHLIGHT_MS = 1_800;
const HOME_LEADER_COUNT = 4;

const getHomeLayoutVariant = (): SurfaceFeedLayoutVariant => "compact";

const getHomeFeedItemId = (item: SurfaceFeedItem<HomeCardEntry>): string =>
  item.descriptor.id;

export function HomeMarketGrid({
  items,
  initialCount = 12,
  incrementCount = 12,
  continuation,
}: HomeMarketGridProps) {
  const feedItems = useMemo<SurfaceFeedItem<HomeCardEntry>[]>(
    () =>
      items.map((item) => ({
        descriptor: {
          id: item.id,
          layoutVariant: getHomeLayoutVariant(),
          layout: {
            base: 12,
            sm: 6,
            md: 4,
            lg: 3,
            xl: 3,
            density: "compact",
          },
          motionPolicy: "bounded-promote",
          renderVariant: `home-market-card:${item.model.kind}`,
          motionKey: item.motionKey,
        },
        model: item,
      })),
    [items],
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
  const liveLeaderIds = useMemo(() => leaderIds.slice(0, HOME_LEADER_COUNT), [leaderIds]);
  const resolvedContinuation = hasMore
    ? {
        hasMore,
        onContinue: showMore,
      }
    : continuation?.hasMore
      ? continuation
      : undefined;

  return (
    <SurfaceFeed
      items={visibleItems}
      highlightedIds={highlightedIds}
      leaderIds={liveLeaderIds}
      continuation={resolvedContinuation}
      className={styles.stack}
      gridClassName={styles.grid}
      actionRowClassName={styles.actionRow}
      renderItem={(item, meta) => (
        <HomeMarketCard
          model={item.model.model}
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
