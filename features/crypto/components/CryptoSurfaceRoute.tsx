"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_CRYPTO_FILTERS,
  getCryptoFilterHref,
  parseCryptoSearchParams,
  resolveCryptoSurfaceState,
  type CryptoFacetState,
  type CryptoFilterState,
  type CryptoCardModel,
} from "../parse";
import { useDeferredCollection } from "@/shared/lib/useDeferredCollection";
import { CryptoSurface } from "./CryptoSurface";

type CryptoSurfaceRouteProps = {
  totalCount: number;
  cards: ReadonlyArray<CryptoCardModel>;
  facets: CryptoFacetState;
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
  initialFilters,
  initialVisibleCount,
  visibleIncrement,
  catalogEndpoint,
}: CryptoSurfaceRouteProps) {
  const [filters, setFilters] = useState(initialFilters);
  const pendingFiltersRef = useRef<CryptoFilterState | null>(null);
  const {
    items: workingCards,
    ensureItems: ensureCatalog,
    hasLoadedDeferredItems,
  } = useDeferredCollection<CryptoCardModel>({
    endpoint: catalogEndpoint,
    initialItems: cards,
    selectItems: (payload) =>
      payload && typeof payload === "object" && "cards" in payload
        ? (((payload as { cards?: ReadonlyArray<CryptoCardModel> }).cards ?? cards) as ReadonlyArray<CryptoCardModel>)
        : cards,
  });
  const resolved = useMemo(() => {
    if (!hasLoadedDeferredItems && areFiltersEqual(filters, initialFilters)) {
      return {
        filters: initialFilters,
        facets,
        cards,
      };
    }

    return resolveCryptoSurfaceState({ cards: workingCards }, filters);
  }, [
    cards,
    facets,
    filters,
    hasLoadedDeferredItems,
    initialFilters,
    workingCards,
  ]);
  const canonicalHref = useMemo(
    () => getCryptoFilterHref(DEFAULT_CRYPTO_FILTERS, resolved.filters),
    [resolved.filters],
  );

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

    if (!hasLoadedDeferredItems && catalogEndpoint) {
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
    <CryptoSurface
      totalCount={totalCount}
      facets={resolved.facets}
      filters={resolved.filters}
      cards={resolved.cards}
      initialVisibleCount={initialVisibleCount}
      visibleIncrement={visibleIncrement}
      onFiltersChange={applyFilterPatch}
    />
  );
}
