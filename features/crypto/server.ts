import { unstable_cache } from "next/cache";
import {
  CRYPTO_INITIAL_VISIBLE_COUNT,
  CRYPTO_OVERSCAN_COUNT,
  CRYPTO_VISIBLE_INCREMENT,
  buildCryptoHydrationSeeds,
  buildCryptoFacetState,
  buildCryptoWorkingSet,
  parseCryptoSearchParams,
  resolveCryptoSurfaceState,
  type CryptoCardModel,
  type CryptoFacetState,
  type CryptoFilterState,
} from "./parse";
import { listEventsKeyset } from "@/features/events/api/gamma";
import type { PriceHydrationSeed } from "@/features/realtime/Hydrator";

type CryptoSearchParams = {
  family?: string | string[] | undefined;
  time?: string | string[] | undefined;
  asset?: string | string[] | undefined;
};

type CryptoPagePayload = {
  totalCount: number;
  cards: ReadonlyArray<CryptoCardModel>;
  facets: CryptoFacetState;
  hydrationSeeds: ReadonlyArray<PriceHydrationSeed>;
  initialFilters: CryptoFilterState;
  initialVisibleCount: number;
  visibleIncrement: number;
};

const CRYPTO_INITIAL_ROUTE_CARD_LIMIT =
  CRYPTO_INITIAL_VISIBLE_COUNT + CRYPTO_VISIBLE_INCREMENT + CRYPTO_OVERSCAN_COUNT;

const CRYPTO_ROUTE_REVALIDATE_SECONDS = 30;
const CRYPTO_ROUTE_CATALOG_LIMIT = 500;

type CryptoCatalogPayload = {
  cards: ReadonlyArray<CryptoCardModel>;
};

const getCachedCryptoCatalogPayload = unstable_cache(
  async (): Promise<CryptoCatalogPayload> => {
  const { events } = await listEventsKeyset({
    tagSlug: "crypto",
    limit: CRYPTO_ROUTE_CATALOG_LIMIT,
    order: "volume24hr",
    ascending: false,
  });

  return buildCryptoWorkingSet(events);
  },
  ["crypto-catalog-payload"],
  {
    revalidate: CRYPTO_ROUTE_REVALIDATE_SECONDS,
  },
);

export async function getCryptoCatalogPayload(): Promise<CryptoCatalogPayload> {
  return getCachedCryptoCatalogPayload();
}

export async function getCryptoPagePayload(
  searchParams: Promise<CryptoSearchParams>,
): Promise<CryptoPagePayload> {
  const [workingSet, query] = await Promise.all([getCryptoCatalogPayload(), searchParams]);
  const initialFilters = parseCryptoSearchParams(query);
  const initialState = resolveCryptoSurfaceState(workingSet, initialFilters);
  const initialCards = initialState.cards.slice(0, CRYPTO_INITIAL_ROUTE_CARD_LIMIT);

  return {
    totalCount: workingSet.cards.length,
    cards: initialCards,
    facets: buildCryptoFacetState(workingSet.cards, initialState.filters),
    hydrationSeeds: buildCryptoHydrationSeeds(initialCards),
    initialFilters: initialState.filters,
    initialVisibleCount: CRYPTO_INITIAL_VISIBLE_COUNT,
    visibleIncrement: CRYPTO_VISIBLE_INCREMENT,
  };
}
