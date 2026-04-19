import {
  buildCryptoFacetState,
  buildCryptoWorkingSet,
  buildHydrationEvents,
  filterCryptoCards,
  getCryptoFilterHref,
  normalizeCryptoFilters,
  parseCryptoSearchParams,
} from "@/features/crypto/parse";
import { CryptoSurface } from "@/features/crypto/components/CryptoSurface";
import { listEventsKeyset } from "@/features/events/api/gamma";
import { Hydrator } from "@/features/realtime/Hydrator";
import { redirect } from "next/navigation";
import styles from "./page.module.css";

type CryptoPageProps = {
  searchParams: Promise<{
    family?: string | string[] | undefined;
    time?: string | string[] | undefined;
    asset?: string | string[] | undefined;
  }>;
};

export default async function CryptoPage({ searchParams }: CryptoPageProps) {
  const [{ events }, query] = await Promise.all([
    listEventsKeyset({
      tagSlug: "crypto",
      limit: 250,
      order: "volume24hr",
      ascending: false,
    }),
    searchParams,
  ]);
  const workingSet = buildCryptoWorkingSet(events);
  const parsedFilters = parseCryptoSearchParams(query);
  const filters = normalizeCryptoFilters(parsedFilters, workingSet);

  if (
    parsedFilters.family !== filters.family ||
    parsedFilters.time !== filters.time ||
    parsedFilters.asset !== filters.asset
  ) {
    redirect(
      getCryptoFilterHref(
        {
          family: "all",
          time: "all",
          asset: "all",
        },
        filters,
      ),
    );
  }

  const facets = buildCryptoFacetState(workingSet.cards, filters);
  const cards = filterCryptoCards(workingSet.cards, filters);
  const hydrationEvents = buildHydrationEvents(cards);

  return (
    <main className={styles.main}>
      <Hydrator events={hydrationEvents} />
      <CryptoSurface
        totalCount={workingSet.cards.length}
        facets={facets}
        filters={filters}
        cards={cards}
      />
    </main>
  );
}
