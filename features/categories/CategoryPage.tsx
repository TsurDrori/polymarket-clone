import { listEvents } from "@/features/events/api/gamma";
import { EventGrid } from "@/features/events/components/EventGrid";
import { Hydrator } from "@/features/realtime/Hydrator";
import { isEventVisible } from "@/shared/lib/tags";
import styles from "@/app/page.module.css";

type Props = {
  tagSlug: string;
};

export async function CategoryPage({ tagSlug }: Props) {
  const events = await listEvents({
    tagSlug,
    limit: 30,
    order: "volume_24hr",
    ascending: false,
  });
  const visible = events.filter(isEventVisible);

  if (visible.length === 0) {
    return (
      <main className={styles.main}>
        <p className={styles.empty}>No markets to show right now.</p>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <Hydrator events={visible} />
      <EventGrid events={visible} />
    </main>
  );
}
