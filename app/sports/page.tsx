import { listEvents } from "@/features/events/api/gamma";
import { isEventVisible } from "@/shared/lib/tags";
import { Hydrator } from "@/features/realtime/Hydrator";
import { SportsHub } from "@/features/sports/components/SportsHub";
import styles from "../page.module.css";

export default async function SportsPage() {
  const events = await listEvents({
    tagSlug: "sports",
    limit: 14,
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
      <SportsHub events={visible} />
    </main>
  );
}
