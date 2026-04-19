import { listEvents } from "@/features/events/api/gamma";
import { isEventVisible } from "@/shared/lib/tags";
import { CryptoExplorer } from "@/features/crypto/components/CryptoExplorer";
import { Hydrator } from "@/features/realtime/Hydrator";
import styles from "../page.module.css";

export default async function CryptoPage() {
  const events = await listEvents({
    tagSlug: "crypto",
    limit: 32,
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
      <CryptoExplorer events={visible} />
    </main>
  );
}
