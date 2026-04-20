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

export type CryptoPagePayload = {
  totalCount: number;
  cards: ReadonlyArray<CryptoCardModel>;
  facets: CryptoFacetState;
  hydrationSeeds: ReadonlyArray<PriceHydrationSeed>;
  initialFilters: CryptoFilterState;
  initialVisibleCount: number;
  visibleIncrement: number;
};

export const CRYPTO_INITIAL_ROUTE_CARD_LIMIT =
  CRYPTO_INITIAL_VISIBLE_COUNT + CRYPTO_VISIBLE_INCREMENT + CRYPTO_OVERSCAN_COUNT;

export type CryptoCatalogPayload = {
  cards: ReadonlyArray<CryptoCardModel>;
};

export async function getCryptoCatalogPayload(): Promise<CryptoCatalogPayload> {
  const { events } = await listEventsKeyset({
    tagSlug: "crypto",
    limit: 120,
    order: "volume24hr",
    ascending: false,
  });

  return buildCryptoWorkingSet(events);
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
