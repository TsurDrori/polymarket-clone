"use client";

import type { PolymarketEvent } from "@/features/events/types";
import {
  buildHydrationSeedsFromEvents,
  type PriceHydrationSeed,
} from "./seeds";
export type { PriceHydrationSeed } from "./seeds";
import { useHydratePriceSeeds } from "./useHydratePriceSeeds";

type HydratorProps = {
  events?: ReadonlyArray<PolymarketEvent>;
  seeds?: ReadonlyArray<PriceHydrationSeed>;
};

export function Hydrator({ events, seeds: explicitSeeds }: HydratorProps) {
  const hydrationSeeds =
    explicitSeeds ?? buildHydrationSeedsFromEvents(events ?? []);
  useHydratePriceSeeds(hydrationSeeds);

  return null;
}
