import type { PolymarketEvent } from "@/features/events/types";
import { EventCard } from "./EventCard";
import styles from "./EventGrid.module.css";

type EventGridProps = {
  events: ReadonlyArray<PolymarketEvent>;
};

export function EventGrid({ events }: EventGridProps) {
  return (
    <div className={styles.grid}>
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
