import { describe, expect, it } from "vitest";
import type { PolymarketEvent, PolymarketMarket, PolymarketTag } from "@/features/events/types";
import {
  getCryptoCoin,
  getCryptoMarketType,
  getCryptoTimeBucket,
} from "./filters";

const market: PolymarketMarket = {
  id: "market-1",
  question: "Will Bitcoin go up?",
  conditionId: "condition-1",
  slug: "bitcoin-up",
  outcomes: ["Yes", "No"],
  outcomePrices: [0.5, 0.5],
  clobTokenIds: ["yes", "no"],
  volumeNum: 1_000,
  liquidityNum: 500,
  lastTradePrice: 0.5,
  bestBid: 0.49,
  bestAsk: 0.51,
  volume24hr: 200,
  oneDayPriceChange: 0.05,
  spread: 0.02,
  acceptingOrders: true,
  closed: false,
};

const buildEvent = (tags: PolymarketTag[]): PolymarketEvent => ({
  id: "event-1",
  ticker: "BTC",
  slug: "btc",
  title: "Bitcoin Up or Down",
  active: true,
  closed: false,
  archived: false,
  featured: false,
  restricted: false,
  liquidity: 10_000,
  volume: 50_000,
  volume24hr: 5_000,
  negRisk: false,
  showAllOutcomes: false,
  showMarketImages: false,
  markets: [market],
  tags,
});

describe("crypto filters", () => {
  it("derives the time bucket from the live crypto tags", () => {
    const event = buildEvent([
      { id: "1", slug: "crypto", label: "Crypto" },
      { id: "2", slug: "5M", label: "5M" },
    ]);

    expect(getCryptoTimeBucket(event)).toBe("5M");
  });

  it("maps market-type tags to the UI filters", () => {
    const upDownEvent = buildEvent([{ id: "1", slug: "up-or-down", label: "Up or Down" }]);
    const rangeEvent = buildEvent([{ id: "2", slug: "neg-risk", label: "Price Range" }]);

    expect(getCryptoMarketType(upDownEvent)).toBe("up-down");
    expect(getCryptoMarketType(rangeEvent)).toBe("price-range");
  });

  it("picks the lead coin tag for the secondary chip row", () => {
    const event = buildEvent([
      { id: "1", slug: "crypto", label: "Crypto" },
      { id: "2", slug: "ethereum", label: "Ethereum" },
    ]);

    expect(getCryptoCoin(event)).toBe("ethereum");
  });
});
