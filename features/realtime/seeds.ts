import type { PolymarketEvent, PolymarketMarket } from "@/features/events/types";

export type PriceHydrationSeed = {
  tokenId: string;
  price: number;
  bestBid: number;
  bestAsk: number;
};

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

export const buildHydrationSeedsFromEvents = (
  events: ReadonlyArray<PolymarketEvent>,
): PriceHydrationSeed[] => {
  const seeds = new Map<string, PriceHydrationSeed>();

  for (const event of events) {
    for (const market of event.markets) {
      market.clobTokenIds.forEach((tokenId, outcomeIndex) => {
        if (!tokenId || seeds.has(tokenId)) return;

        seeds.set(tokenId, {
          tokenId,
          price: getSeedPrice(market, outcomeIndex),
          bestBid: outcomeIndex === 0 ? market.bestBid : 0,
          bestAsk: outcomeIndex === 0 ? market.bestAsk : 0,
        });
      });
    }
  }

  return [...seeds.values()];
};
