import { notFound } from "next/navigation";
import { EventHeader } from "@/features/detail/components/EventHeader";
import { MarketList } from "@/features/detail/components/MarketList";
import { GammaError, getEventBySlug } from "@/features/events/api/gamma";
import type { PolymarketEvent } from "@/features/events/types";
import { Hydrator } from "@/features/realtime/Hydrator";
import styles from "./page.module.css";

export default async function EventPage(props: PageProps<"/event/[slug]">) {
  const { slug } = await props.params;
  let event: PolymarketEvent;

  try {
    event = await getEventBySlug(slug);
  } catch (error) {
    if (error instanceof GammaError && error.status === 404) {
      notFound();
    }

    throw error;
  }

  return (
    <main className={styles.main}>
      <Hydrator events={[event]} />
      <EventHeader event={event} />
      <MarketList markets={event.markets} />
    </main>
  );
}
