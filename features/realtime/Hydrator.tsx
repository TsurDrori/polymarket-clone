"use client";

import { useHydrateAtoms } from "jotai/utils";
import type { PolymarketEvent, PolymarketMarket } from "@/features/events/types";
import { priceAtomFamily, type Tick } from "./atoms";

export type PriceHydrationSeed = {
  tokenId: string;
  price: number;
  bestBid: number;
  bestAsk: number;
};

const HYDRATION_TS = 1;

const clampPrice = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
};

const getSeedPrice = (market: PolymarketMarket, outcomeIndex: number): number => {
  if (outcomeIndex === 0) {
    return clampPrice(market.lastTradePrice);
  }

  const outcomePrice = market.outcomePrices[outcomeIndex];
  if (Number.isFinite(outcomePrice)) {
    return clampPrice(outcomePrice);
  }

  if (outcomeIndex === 1) {
    return clampPrice(1 - market.lastTradePrice);
  }

  return 0;
};

const getSeedTick = (market: PolymarketMarket, outcomeIndex: number): Tick => ({
  price: getSeedPrice(market, outcomeIndex),
  bestBid: outcomeIndex === 0 ? market.bestBid : 0,
  bestAsk: outcomeIndex === 0 ? market.bestAsk : 0,
  ts: HYDRATION_TS,
});

type HydratorProps = {
  events?: ReadonlyArray<PolymarketEvent>;
  seeds?: ReadonlyArray<PriceHydrationSeed>;
};

export const buildHydrationSeedsFromEvents = (
  events: ReadonlyArray<PolymarketEvent>,
): PriceHydrationSeed[] => {
  const seeds = new Map<string, PriceHydrationSeed>();

  for (const event of events) {
    for (const market of event.markets) {
      market.clobTokenIds.forEach((tokenId, outcomeIndex) => {
        if (!tokenId) return;
        if (seeds.has(tokenId)) return;

        const tick = getSeedTick(market, outcomeIndex);
        seeds.set(tokenId, {
          tokenId,
          price: tick.price,
          bestBid: tick.bestBid,
          bestAsk: tick.bestAsk,
        });
      });
    }
  }

  return [...seeds.values()];
};

export function Hydrator({ events, seeds: explicitSeeds }: HydratorProps) {
  const seeds = new Map<ReturnType<typeof priceAtomFamily>, Tick>();
  const hydrationSeeds =
    explicitSeeds ?? buildHydrationSeedsFromEvents(events ?? []);

  for (const seed of hydrationSeeds) {
    seeds.set(priceAtomFamily(seed.tokenId), {
      price: seed.price,
      bestBid: seed.bestBid,
      bestAsk: seed.bestAsk,
      ts: HYDRATION_TS,
    });
  }

  useHydrateAtoms(seeds);

  return null;
}
