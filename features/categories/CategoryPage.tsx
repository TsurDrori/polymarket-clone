import { listEvents } from "@/features/events/api/gamma";
import { EventGrid } from "@/features/events/components/EventGrid";
import { collectTrendingTopics } from "@/features/home/selectors";
import { Hydrator } from "@/features/realtime/Hydrator";
import { isEventVisible } from "@/shared/lib/tags";
import styles from "./CategoryPage.module.css";

type Props = {
  tagSlug: string;
  title: string;
  description: string;
};

export async function CategoryPage({ tagSlug, title, description }: Props) {
  const events = await listEvents({
    tagSlug,
    limit: 20,
    order: "volume_24hr",
    ascending: false,
  });
  const visible = events.filter(isEventVisible);
  const topics = collectTrendingTopics(visible, 10);

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
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Category surface</p>
          <h1 className={styles.title}>{title}</h1>
        </div>
        <p className={styles.description}>{description}</p>
        {topics.length > 0 ? (
          <div className={styles.topicRow}>
            {topics.map((topic) => (
              <span key={topic.slug} className={styles.topicPill}>
                {topic.label}
              </span>
            ))}
          </div>
        ) : null}
      </header>
      <EventGrid events={visible} />
    </main>
  );
}
