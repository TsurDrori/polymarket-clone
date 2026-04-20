import type { PolymarketEvent } from "@/features/events/types";
import { GenericEventFeed } from "@/features/events/feed/GenericEventFeed";
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
  return (
    <GenericEventFeed
      events={events}
      initialCount={initialCount}
      incrementCount={incrementCount}
      continuationLabel={continuationLabel}
      className={styles.stack}
      gridClassName={styles.grid}
      actionRowClassName={styles.actionRow}
    />
  );
}
