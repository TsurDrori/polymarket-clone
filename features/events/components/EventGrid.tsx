"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [visibleCount, setVisibleCount] = useState(
    canPaginate ? initialCount : events.length,
  );

  useEffect(() => {
    setVisibleCount(canPaginate ? initialCount : events.length);
  }, [canPaginate, events.length, initialCount]);

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
              setVisibleCount((count) =>
                Math.min(events.length, count + (incrementCount ?? events.length)),
              )
            }
          >
            {continuationLabel}
          </ContinuationButton>
        </div>
      ) : null}
    </div>
  );
}
