import { CategoryPage } from "@/features/categories/CategoryPage";
import { listEvents } from "@/features/events/api/gamma";
import { buildCryptoFacets, buildCryptoSections } from "@/features/crypto/filters";
import { Hydrator } from "@/features/realtime/Hydrator";
import { isEventVisible } from "@/shared/lib/tags";

export default async function CryptoPage() {
  const events = await listEvents({
    tagSlug: "crypto",
    limit: 18,
    order: "volume_24hr",
    ascending: false,
  });
  const visible = events.filter(isEventVisible);
  const sections = buildCryptoSections(visible);
  const usedIds = new Set(sections.flatMap((section) => section.events.map((event) => event.id)));
  const remainder = visible.filter((event) => !usedIds.has(event.id));
  const facets = buildCryptoFacets(visible).map((facet) => ({
    slug: facet.slug,
    label: facet.label,
    meta: `${facet.count} markets`,
  }));

  return (
    <>
      <Hydrator events={visible} />
      <CategoryPage
        eyebrow="Crypto"
        title="Crypto"
        facets={facets}
        sections={sections}
        events={remainder}
        marketTitle={sections.length > 0 ? "More crypto markets" : "All crypto markets"}
      />
    </>
  );
}
