"use client";

import { useEffect, useMemo, useRef } from "react";
import { useStore } from "jotai/react";
import { priceAtomFamily, type Tick } from "./atoms";
import type { PriceHydrationSeed } from "./seeds";

const HYDRATION_TS = 1;

const buildTick = (seed: PriceHydrationSeed): Tick => ({
  price: seed.price,
  bestBid: seed.bestBid,
  bestAsk: seed.bestAsk,
  ts: HYDRATION_TS,
  prevPrice: seed.price,
  changedAt: 0,
  changeMagnitude: 0,
});

export function useHydratePriceSeeds(seeds: ReadonlyArray<PriceHydrationSeed>) {
  const store = useStore();
  const hydratedTokenIdsRef = useRef<Set<string>>(new Set());
  const stableSeeds = useMemo(
    () =>
      seeds.map((seed) => ({
        tokenId: seed.tokenId,
        tick: buildTick(seed),
      })),
    [seeds],
  );

  useEffect(() => {
    for (const seed of stableSeeds) {
      if (hydratedTokenIdsRef.current.has(seed.tokenId)) {
        continue;
      }

      hydratedTokenIdsRef.current.add(seed.tokenId);
      store.set(priceAtomFamily(seed.tokenId), seed.tick);
    }
  }, [stableSeeds, store]);
}
