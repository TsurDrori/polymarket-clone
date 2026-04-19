"use client";

import { useHydrateAtoms } from "jotai/utils";
import { priceAtomFamily, type Tick } from "@/features/realtime/atoms";
import type { SportsPreviewHydrationSeed } from "./parse";

type SportsRowsHydratorProps = {
  seeds: ReadonlyArray<SportsPreviewHydrationSeed>;
};

export function SportsRowsHydrator({ seeds }: SportsRowsHydratorProps) {
  const atoms = new Map<ReturnType<typeof priceAtomFamily>, Tick>();

  for (const seed of seeds) {
    atoms.set(priceAtomFamily(seed.tokenId), {
      price: seed.price,
      bestBid: seed.bestBid,
      bestAsk: seed.bestAsk,
      ts: 0,
    });
  }

  useHydrateAtoms(atoms);

  return null;
}
