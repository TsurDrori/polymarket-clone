"use client";

import { useHydrateAtoms } from "jotai/utils";
import type { PolymarketEvent, PolymarketMarket } from "@/features/events/types";
import { priceAtomFamily, type Tick } from "./atoms";

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
  ts: 0,
});

type HydratorProps = {
  events: ReadonlyArray<PolymarketEvent>;
};

export function Hydrator({ events }: HydratorProps) {
  const seeds = new Map<ReturnType<typeof priceAtomFamily>, Tick>();

  for (const event of events) {
    for (const market of event.markets) {
      market.clobTokenIds.forEach((tokenId, outcomeIndex) => {
        if (!tokenId) return;
        seeds.set(priceAtomFamily(tokenId), getSeedTick(market, outcomeIndex));
      });
    }
  }

  useHydrateAtoms(seeds);

  return null;
}
