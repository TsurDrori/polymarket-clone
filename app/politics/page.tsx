import { listEvents } from "@/features/events/api/gamma";
import { CategoryPage } from "@/features/categories/CategoryPage";
import { collectTrendingTopics } from "@/features/home/selectors";
import { Hydrator } from "@/features/realtime/Hydrator";
import { isEventVisible } from "@/shared/lib/tags";

export default async function PoliticsPage() {
  const events = await listEvents({
    tagSlug: "politics",
    limit: 18,
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
        description="The biggest politics markets right now, surfaced as a lighter category grid with real topic context instead of bespoke dashboard chrome."
        facets={facets}
        events={visible}
        marketDescription="Live politics markets sorted by 24-hour volume."
      />
    </>
  );
}
