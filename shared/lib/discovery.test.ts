import { describe, expect, it, vi } from "vitest";
import type { PolymarketEvent, PolymarketMarket } from "@/features/events/types";
import { compareEventsForDiscovery, isEventHotDiscoveryCandidate } from "./discovery";

const buildMarket = (
  overrides: Partial<PolymarketMarket> = {},
): PolymarketMarket => ({
  id: overrides.id ?? crypto.randomUUID(),
  question: overrides.question ?? "Will this happen?",
  conditionId: overrides.conditionId ?? crypto.randomUUID(),
  slug: overrides.slug ?? "will-this-happen",
  outcomes: overrides.outcomes ?? ["Yes", "No"],
  outcomePrices: overrides.outcomePrices ?? [0.55, 0.45],
  clobTokenIds: overrides.clobTokenIds ?? ["yes-token", "no-token"],
  volumeNum: overrides.volumeNum ?? 10_000,
  liquidityNum: overrides.liquidityNum ?? 5_000,
  lastTradePrice: overrides.lastTradePrice ?? 0.55,
  bestBid: overrides.bestBid ?? 0.54,
  bestAsk: overrides.bestAsk ?? 0.56,
  volume24hr: overrides.volume24hr ?? 2_000,
  oneDayPriceChange: overrides.oneDayPriceChange ?? 0.08,
  spread: overrides.spread ?? 0.02,
  acceptingOrders: overrides.acceptingOrders ?? true,
  closed: overrides.closed ?? false,
});

const buildEvent = (
  title: string,
  overrides: Partial<PolymarketEvent> = {},
): PolymarketEvent => ({
  id: overrides.id ?? crypto.randomUUID(),
  ticker: overrides.ticker ?? title,
  slug: overrides.slug ?? title.toLowerCase().replaceAll(/\s+/g, "-"),
  title,
  active: overrides.active ?? true,
  closed: overrides.closed ?? false,
  archived: overrides.archived ?? false,
  featured: overrides.featured ?? false,
  restricted: overrides.restricted ?? false,
  liquidity: overrides.liquidity ?? 1_000_000,
  volume: overrides.volume ?? 2_000_000,
  volume24hr: overrides.volume24hr ?? 500_000,
  negRisk: overrides.negRisk ?? false,
  showAllOutcomes: overrides.showAllOutcomes ?? false,
  showMarketImages: overrides.showMarketImages ?? false,
  markets: overrides.markets ?? [buildMarket()],
  tags: overrides.tags ?? [{ id: "tag", slug: "crypto", label: "Crypto" }],
  endDate: overrides.endDate,
  ended: overrides.ended,
});

describe("discovery ranking", () => {
  it("prefers current tradable events over stale high-volume resolved ones", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-23T18:00:00.000Z"));

    const staleResolved = buildEvent("Bitcoin Up or Down on April 23?", {
      id: "stale",
      volume24hr: 900_000,
      endDate: "2026-04-23T16:00:00.000Z",
      markets: [
        buildMarket({
          lastTradePrice: 0.995,
          bestBid: 0.99,
          bestAsk: 1,
        }),
      ],
    });
    const currentTradable = buildEvent("Bitcoin above ___ on April 24?", {
      id: "current",
      volume24hr: 200_000,
      endDate: "2026-04-24T16:00:00.000Z",
      markets: [
        buildMarket({
          lastTradePrice: 0.58,
          bestBid: 0.57,
          bestAsk: 0.59,
        }),
      ],
    });

    expect(isEventHotDiscoveryCandidate(staleResolved)).toBe(false);
    expect(isEventHotDiscoveryCandidate(currentTradable)).toBe(true);
    expect(compareEventsForDiscovery(currentTradable, staleResolved)).toBeLessThan(0);

    vi.useRealTimers();
  });
});
