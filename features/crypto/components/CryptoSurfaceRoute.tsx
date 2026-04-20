"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Hydrator, type PriceHydrationSeed } from "@/features/realtime/Hydrator";
import {
  DEFAULT_CRYPTO_FILTERS,
  getCryptoFilterHref,
  parseCryptoSearchParams,
  resolveCryptoSurfaceState,
  type CryptoFacetState,
  type CryptoFilterState,
  type CryptoCardModel,
} from "../parse";
import { CryptoSurface } from "./CryptoSurface";

type CryptoSurfaceRouteProps = {
  totalCount: number;
  cards: ReadonlyArray<CryptoCardModel>;
  facets: CryptoFacetState;
  hydrationSeeds?: ReadonlyArray<PriceHydrationSeed>;
  initialFilters: CryptoFilterState;
  initialVisibleCount?: number;
  visibleIncrement?: number;
  catalogEndpoint?: string;
};

const areFiltersEqual = (
  left: CryptoFilterState,
  right: CryptoFilterState,
): boolean =>
  left.family === right.family &&
  left.time === right.time &&
  left.asset === right.asset;

const readCurrentFilters = (): CryptoFilterState => {
  const params = new URLSearchParams(window.location.search);

  return parseCryptoSearchParams({
    family: params.get("family") ?? undefined,
    time: params.get("time") ?? undefined,
    asset: params.get("asset") ?? undefined,
  });
};

export function CryptoSurfaceRoute({
  cards,
  facets,
  totalCount,
  hydrationSeeds,
  initialFilters,
  initialVisibleCount,
  visibleIncrement,
  catalogEndpoint,
}: CryptoSurfaceRouteProps) {
  const [filters, setFilters] = useState(initialFilters);
  const [catalogCards, setCatalogCards] = useState<ReadonlyArray<CryptoCardModel> | null>(
    null,
  );
  const catalogPromiseRef = useRef<Promise<ReadonlyArray<CryptoCardModel>> | null>(null);
  const pendingFiltersRef = useRef<CryptoFilterState | null>(null);
  const workingCards = catalogCards ?? cards;
  const resolved = useMemo(() => {
    if (catalogCards === null && areFiltersEqual(filters, initialFilters)) {
      return {
        filters: initialFilters,
        facets,
        cards,
        hydrationSeeds: hydrationSeeds ?? [],
      };
    }

    return resolveCryptoSurfaceState({ cards: workingCards }, filters);
  }, [cards, catalogCards, facets, filters, hydrationSeeds, initialFilters, workingCards]);
  const canonicalHref = useMemo(
    () => getCryptoFilterHref(DEFAULT_CRYPTO_FILTERS, resolved.filters),
    [resolved.filters],
  );
  const ensureCatalog = useCallback(async (): Promise<ReadonlyArray<CryptoCardModel>> => {
    if (catalogCards) {
      return catalogCards;
    }

    if (!catalogEndpoint) {
      return cards;
    }

    if (catalogPromiseRef.current) {
      return catalogPromiseRef.current;
    }

    const nextPromise = fetch(catalogEndpoint, { method: "GET" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load crypto catalog");
        }

        const payload = (await response.json()) as {
          cards?: ReadonlyArray<CryptoCardModel>;
        };

        return payload.cards ?? cards;
      })
      .then((nextCards) => {
        startTransition(() => {
          setCatalogCards(nextCards);
        });

        return nextCards;
      })
      .finally(() => {
        catalogPromiseRef.current = null;
      });

    catalogPromiseRef.current = nextPromise;
    return nextPromise;
  }, [cards, catalogCards, catalogEndpoint]);
  const applyFilterPatch = (patch: Partial<CryptoFilterState>) => {
    const nextFilters = {
      ...filters,
      ...patch,
    };

    if (areFiltersEqual(nextFilters, filters)) {
      return;
    }

    window.history.pushState(
      null,
      "",
      getCryptoFilterHref(DEFAULT_CRYPTO_FILTERS, nextFilters),
    );

    if (catalogCards === null && catalogEndpoint) {
      pendingFiltersRef.current = nextFilters;

      void ensureCatalog()
        .then(() => {
          const pendingFilters = pendingFiltersRef.current ?? nextFilters;
          pendingFiltersRef.current = null;

          startTransition(() => {
            setFilters(pendingFilters);
          });
        })
        .catch(() => {
          pendingFiltersRef.current = null;

          startTransition(() => {
            setFilters(nextFilters);
          });
        });
      return;
    }

    startTransition(() => {
      setFilters(nextFilters);
    });
  };

  useEffect(() => {
    if (areFiltersEqual(resolved.filters, filters)) {
      return;
    }

    startTransition(() => {
      setFilters(resolved.filters);
    });
  }, [filters, resolved.filters]);

  useEffect(() => {
    const currentHref = `${window.location.pathname}${window.location.search}`;

    if (currentHref === canonicalHref) {
      return;
    }

    window.history.replaceState(null, "", canonicalHref);
  }, [canonicalHref]);

  useEffect(() => {
    if (!catalogEndpoint) {
      return;
    }

    void ensureCatalog().catch(() => null);
  }, [catalogEndpoint, ensureCatalog]);

  useEffect(() => {
    const handlePopState = () => {
      startTransition(() => {
        setFilters(readCurrentFilters());
      });
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return (
    <>
      <CryptoSurface
        totalCount={totalCount}
        facets={resolved.facets}
        filters={resolved.filters}
        cards={resolved.cards}
        initialVisibleCount={initialVisibleCount}
        visibleIncrement={visibleIncrement}
        onFiltersChange={applyFilterPatch}
      />
      <Hydrator seeds={hydrationSeeds} />
    </>
  );
}
