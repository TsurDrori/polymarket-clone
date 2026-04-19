import { listEvents } from "@/features/events/api/gamma";
import { HomePage } from "@/features/home/HomePage";
import { Hydrator } from "@/features/realtime/Hydrator";
import { isEventVisible } from "@/shared/lib/tags";
import styles from "./page.module.css";

export default async function Home() {
  const events = await listEvents({
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
      <HomePage events={visible} />
    </main>
  );
}
