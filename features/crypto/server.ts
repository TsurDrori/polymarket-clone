import {
  CRYPTO_INITIAL_VISIBLE_COUNT,
  CRYPTO_OVERSCAN_COUNT,
  CRYPTO_VISIBLE_INCREMENT,
  buildCryptoHydrationSeeds,
  buildCryptoWorkingSet,
  parseCryptoSearchParams,
  resolveCryptoSurfaceState,
  type CryptoCardModel,
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
  hydrationSeeds: ReadonlyArray<PriceHydrationSeed>;
  initialFilters: CryptoFilterState;
  initialVisibleCount: number;
  visibleIncrement: number;
};

const CRYPTO_ROUTE_REVALIDATE_SECONDS = 30;

export async function getCryptoPagePayload(
  searchParams: Promise<CryptoSearchParams>,
): Promise<CryptoPagePayload> {
  const [{ events }, query] = await Promise.all([
    listEventsKeyset({
      tagSlug: "crypto",
      limit: 120,
      order: "volume24hr",
      ascending: false,
      revalidate: CRYPTO_ROUTE_REVALIDATE_SECONDS,
    }),
    searchParams,
  ]);

  const workingSet = buildCryptoWorkingSet(events);
  const initialFilters = parseCryptoSearchParams(query);
  const initialState = resolveCryptoSurfaceState(workingSet, initialFilters);

  return {
    totalCount: workingSet.cards.length,
    cards: initialState.cards,
    hydrationSeeds: buildCryptoHydrationSeeds(initialState.cards, {
      cardLimit: CRYPTO_INITIAL_VISIBLE_COUNT + CRYPTO_OVERSCAN_COUNT,
    }),
    initialFilters: initialState.filters,
    initialVisibleCount: CRYPTO_INITIAL_VISIBLE_COUNT,
    visibleIncrement: CRYPTO_VISIBLE_INCREMENT,
  };
}
