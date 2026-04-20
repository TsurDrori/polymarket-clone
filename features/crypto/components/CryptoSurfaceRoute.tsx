"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { Hydrator, type PriceHydrationSeed } from "@/features/realtime/Hydrator";
import {
  DEFAULT_CRYPTO_FILTERS,
  getCryptoFilterHref,
  parseCryptoSearchParams,
  resolveCryptoSurfaceState,
  type CryptoFilterState,
  type CryptoCardModel,
} from "../parse";
import { CryptoSurface } from "./CryptoSurface";

type CryptoSurfaceRouteProps = {
  totalCount: number;
  cards: ReadonlyArray<CryptoCardModel>;
  hydrationSeeds?: ReadonlyArray<PriceHydrationSeed>;
  initialFilters: CryptoFilterState;
  initialVisibleCount?: number;
  visibleIncrement?: number;
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
  totalCount,
  hydrationSeeds,
  initialFilters,
  initialVisibleCount,
  visibleIncrement,
}: CryptoSurfaceRouteProps) {
  const [filters, setFilters] = useState(initialFilters);
  const resolved = useMemo(
    () => resolveCryptoSurfaceState({ cards }, filters),
    [cards, filters],
  );
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
