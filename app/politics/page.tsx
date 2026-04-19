import type { Metadata } from "next";
import { listEvents } from "@/features/events/api/gamma";
import { CategoryPage } from "@/features/categories/CategoryPage";
import { collectTrendingTopics } from "@/features/home/selectors";
import { Hydrator } from "@/features/realtime/Hydrator";
import { isEventVisible } from "@/shared/lib/tags";

export const metadata: Metadata = {
  title: "Politics Prediction Markets & Live Odds 2026 | Polymarket",
  description:
    "Politics markets, topic facets, and high-volume election contracts framed with the shared shell and continuation pattern.",
};

export const dynamic = "force-dynamic";

export default async function PoliticsPage() {
  const events = await listEvents({
    tagSlug: "politics",
    limit: 30,
    order: "volume_24hr",
    ascending: false,
  });
  const visible = events.filter(isEventVisible);
  const facets = collectTrendingTopics(visible, 10).map((topic) => ({
    slug: topic.slug,
    label: topic.label,
    meta: `${topic.eventCount} markets`,
  }));

  return (
    <>
      <Hydrator events={visible} />
      <CategoryPage
        eyebrow="Politics"
        title="Politics"
        facets={facets}
        events={visible}
        initialEventCount={18}
        eventIncrement={18}
      />
    </>
  );
}
