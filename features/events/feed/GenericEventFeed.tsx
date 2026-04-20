"use client";

import { useMemo } from "react";
import type { SurfaceProjectionPolicy } from "@/features/realtime/surfaces/types";
import { useProjectedSurfaceWindow } from "@/features/realtime/surfaces/hooks";
import type { PolymarketEvent } from "../types";
import { EventCard } from "../components/EventCard";
import { SurfaceFeed } from "./SurfaceFeed";
import type { SurfaceFeedItem } from "./types";

type GenericEventFeedProps = {
  events: ReadonlyArray<PolymarketEvent>;
  initialCount?: number;
  incrementCount?: number;
  continuationLabel?: string;
  className?: string;
  gridClassName?: string;
  actionRowClassName?: string;
};

const getFeedItemId = (item: SurfaceFeedItem<PolymarketEvent>): string => item.descriptor.id;

export function GenericEventFeed({
  events,
  initialCount,
  incrementCount,
  continuationLabel = "Show more markets",
  className,
  gridClassName,
  actionRowClassName,
}: GenericEventFeedProps) {
  const feedItems = useMemo<SurfaceFeedItem<PolymarketEvent>[]>(
    () =>
      events.map((event) => ({
        descriptor: {
          id: event.id,
          layoutVariant: "standard",
          motionPolicy: "static",
          renderVariant: "event-card",
        },
        model: event,
      })),
    [events],
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
      overscanCount: 0,
      maxPromotionsPerCycle: 0,
      reorderCooldownMs: 0,
      highlightMs: 0,
    }),
    [feedItems.length, incrementCount, initialCount],
  );
  const { visibleItems, hasMore, showMore } = useProjectedSurfaceWindow({
    items: feedItems,
    getItemId: getFeedItemId,
    getItemTokenIds: () => [],
    getItemLiveScore: () => 0,
    policy: projectionPolicy,
  });

  return (
    <SurfaceFeed
      items={visibleItems}
      continuation={{
        hasMore,
        onContinue: showMore,
        label: continuationLabel,
      }}
      className={className}
      gridClassName={gridClassName}
      actionRowClassName={actionRowClassName}
      renderItem={(item) => <EventCard event={item.model} />}
    />
  );
}
