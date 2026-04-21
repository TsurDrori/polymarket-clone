"use client";

import type { PriceHydrationSeed } from "@/features/realtime/Hydrator";
import { useHydratePriceSeeds } from "@/features/realtime/useHydratePriceSeeds";

type SportsRowsHydratorProps = {
  seeds: ReadonlyArray<PriceHydrationSeed>;
};

export function SportsRowsHydrator({ seeds }: SportsRowsHydratorProps) {
  useHydratePriceSeeds(seeds);

  return null;
}
