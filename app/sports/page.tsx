import { CategoryPage } from "@/features/categories/CategoryPage";
import { listEvents } from "@/features/events/api/gamma";
import { isEventVisible } from "@/shared/lib/tags";
import { Hydrator } from "@/features/realtime/Hydrator";
import { buildSportsLeagueSections } from "@/features/sports/parse";

export default async function SportsPage() {
  const events = await listEvents({
    tagSlug: "sports",
    limit: 12,
    order: "volume_24hr",
    ascending: false,
  });
  const visible = events.filter(isEventVisible);
  const sections = buildSportsLeagueSections(visible);
  const usedIds = new Set(sections.flatMap((section) => section.events.map((event) => event.id)));
  const remainder = visible.filter((event) => !usedIds.has(event.id));
  const facets = sections.map((section) => ({
    slug: section.slug,
    label: section.label,
    meta: `${section.count} markets`,
  }));

  return (
    <>
      <Hydrator events={visible} />
      <CategoryPage
        eyebrow="Sports"
        title="Sports"
        description="A safer sports baseline grouped by league when tags are available, while always keeping a populated fallback grid instead of defaulting to an empty live-only state."
        facets={facets}
        sections={sections.map((section) => ({
          id: section.slug,
          title: section.label,
          description: `The most active ${section.label} markets in the current sports slice.`,
          events: section.events,
        }))}
        events={remainder}
        marketTitle={sections.length > 0 ? "More sports markets" : "All sports markets"}
        marketDescription="Live sports markets sorted by 24-hour volume."
      />
    </>
  );
}
