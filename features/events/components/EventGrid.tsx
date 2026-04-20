"use client";

import { useMemo, useState } from "react";
import type { PolymarketEvent } from "@/features/events/types";
import { ContinuationButton } from "@/shared/ui/ContinuationButton";
import { EventCard } from "./EventCard";
import styles from "./EventGrid.module.css";

type EventGridProps = {
  events: ReadonlyArray<PolymarketEvent>;
  initialCount?: number;
  incrementCount?: number;
  continuationLabel?: string;
};

type PaginationState = {
  resetKey: string;
  visibleCount: number;
};

const createPaginationState = (
  resetKey: string,
  initialVisibleCount: number,
): PaginationState => ({
  resetKey,
  visibleCount: initialVisibleCount,
});

export function EventGrid({
  events,
  initialCount,
  incrementCount,
  continuationLabel = "Show more markets",
}: EventGridProps) {
  const canPaginate =
    typeof initialCount === "number" &&
    initialCount > 0 &&
    typeof incrementCount === "number" &&
    incrementCount > 0 &&
    events.length > initialCount;
  const initialVisibleCount = canPaginate ? initialCount : events.length;
  const eventsKey = useMemo(() => events.map((event) => event.id).join("|"), [events]);
  const paginationResetKey = `${eventsKey}:${initialVisibleCount}`;
  const [paginationState, setPaginationState] = useState<PaginationState>(() =>
    createPaginationState(paginationResetKey, initialVisibleCount),
  );
  const visibleCount =
    paginationState.resetKey === paginationResetKey
      ? paginationState.visibleCount
      : initialVisibleCount;

  const visibleEvents = useMemo(
    () => events.slice(0, canPaginate ? visibleCount : events.length),
    [canPaginate, events, visibleCount],
  );
  const hasMore = canPaginate && visibleCount < events.length;

  return (
    <div className={styles.stack}>
      <div className={styles.grid}>
        {visibleEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      {hasMore ? (
        <div className={styles.actionRow}>
          <ContinuationButton
            onClick={() =>
              setPaginationState((currentState) => {
                const currentVisibleCount =
                  currentState.resetKey === paginationResetKey
                    ? currentState.visibleCount
                    : initialVisibleCount;

                return {
                  resetKey: paginationResetKey,
                  visibleCount: Math.min(
                    events.length,
                    currentVisibleCount + (incrementCount ?? events.length),
                  ),
                };
              })
            }
          >
            {continuationLabel}
          </ContinuationButton>
        </div>
      ) : null}
    </div>
  );
}
