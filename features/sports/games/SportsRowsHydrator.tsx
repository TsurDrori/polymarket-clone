"use client";

import { useHydrateAtoms } from "jotai/utils";
import { priceAtomFamily, type Tick } from "@/features/realtime/atoms";
import type { PriceHydrationSeed } from "@/features/realtime/Hydrator";

type SportsRowsHydratorProps = {
  seeds: ReadonlyArray<PriceHydrationSeed>;
};

export function SportsRowsHydrator({ seeds }: SportsRowsHydratorProps) {
  const atoms = new Map<ReturnType<typeof priceAtomFamily>, Tick>();

  for (const seed of seeds) {
    atoms.set(priceAtomFamily(seed.tokenId), {
      price: seed.price,
      bestBid: seed.bestBid,
      bestAsk: seed.bestAsk,
      ts: 1,
      prevPrice: seed.price,
      changedAt: 0,
      changeMagnitude: 0,
    });
  }

  useHydrateAtoms(atoms);

  return null;
}
