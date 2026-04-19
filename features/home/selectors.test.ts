import { describe, expect, it } from "vitest";
import type { PolymarketEvent, PolymarketMarket, PolymarketTag } from "@/features/events/types";
import {
  collectTrendingTopics,
  getPrimaryMarket,
  selectBreakingItems,
  selectFeaturedEvents,
} from "./selectors";

const buildMarket = (
  overrides: Partial<PolymarketMarket> = {},
): PolymarketMarket => ({
  id: overrides.id ?? crypto.randomUUID(),
  question: overrides.question ?? "Will this happen?",
  conditionId: overrides.conditionId ?? crypto.randomUUID(),
  slug: overrides.slug ?? "will-this-happen",
  groupItemTitle: overrides.groupItemTitle,
  image: overrides.image,
  icon: overrides.icon,
  endDate: overrides.endDate,
  outcomes: overrides.outcomes ?? ["Yes", "No"],
  outcomePrices: overrides.outcomePrices ?? [0.65, 0.35],
  clobTokenIds: overrides.clobTokenIds ?? ["yes-token", "no-token"],
  volumeNum: overrides.volumeNum ?? 10_000,
  liquidityNum: overrides.liquidityNum ?? 5_000,
  lastTradePrice: overrides.lastTradePrice ?? 0.65,
  bestBid: overrides.bestBid ?? 0.64,
  bestAsk: overrides.bestAsk ?? 0.66,
  volume24hr: overrides.volume24hr ?? 2_000,
  oneDayPriceChange: overrides.oneDayPriceChange ?? 0.08,
  spread: overrides.spread ?? 0.02,
  acceptingOrders: overrides.acceptingOrders ?? true,
  closed: overrides.closed ?? false,
});

const buildEvent = (
  title: string,
  tags: PolymarketTag[],
  overrides: Partial<PolymarketEvent> = {},
): PolymarketEvent => ({
  id: overrides.id ?? crypto.randomUUID(),
  ticker: overrides.ticker ?? title,
  slug: overrides.slug ?? title.toLowerCase().replaceAll(/\s+/g, "-"),
  title,
  description: overrides.description,
  startDate: overrides.startDate,
  creationDate: overrides.creationDate,
  endDate: overrides.endDate,
  image: overrides.image,
  icon: overrides.icon,
  active: overrides.active ?? true,
  closed: overrides.closed ?? false,
  archived: overrides.archived ?? false,
  featured: overrides.featured ?? false,
  restricted: overrides.restricted ?? false,
  liquidity: overrides.liquidity ?? 1_000_000,
  volume: overrides.volume ?? 2_000_000,
  volume24hr: overrides.volume24hr ?? 500_000,
  volume1wk: overrides.volume1wk,
  volume1mo: overrides.volume1mo,
  volume1yr: overrides.volume1yr,
  openInterest: overrides.openInterest,
  negRisk: overrides.negRisk ?? false,
  commentCount: overrides.commentCount,
  showAllOutcomes: overrides.showAllOutcomes ?? false,
  showMarketImages: overrides.showMarketImages ?? false,
  markets: overrides.markets ?? [buildMarket()],
  tags,
});

describe("selectFeaturedEvents", () => {
  it("prioritizes a varied hero set before filling from ranked events", () => {
    const politics = buildEvent(
      "Election Winner",
      [
        { id: "1", slug: "politics", label: "Politics" },
        { id: "2", slug: "election", label: "Election" },
      ],
      { featured: true, volume24hr: 500 },
    );
    const sports = buildEvent(
      "Knicks vs. Celtics",
      [{ id: "3", slug: "sports", label: "Sports" }, { id: "4", slug: "games", label: "Games" }],
      { featured: false, volume24hr: 400 },
    );
    const crypto = buildEvent(
      "Bitcoin Up or Down",
      [{ id: "5", slug: "crypto", label: "Crypto" }],
      { featured: false, volume24hr: 350 },
    );
    const filler = buildEvent(
      "Another Market",
      [{ id: "6", slug: "culture", label: "Culture" }],
      { volume24hr: 300 },
    );

    const picked = selectFeaturedEvents([filler, crypto, sports, politics], 4);

    expect(picked.map((event) => event.title)).toEqual([
      "Election Winner",
      "Knicks vs. Celtics",
      "Bitcoin Up or Down",
      "Another Market",
    ]);
  });
});

describe("selectBreakingItems", () => {
  it("returns the highest moving unique events", () => {
    const highMove = buildEvent("High Move", [{ id: "1", slug: "tech", label: "Tech" }], {
      markets: [buildMarket({ oneDayPriceChange: 0.35, lastTradePrice: 0.71 })],
    });
    const mediumMove = buildEvent("Medium Move", [{ id: "2", slug: "sports", label: "Sports" }], {
      markets: [buildMarket({ oneDayPriceChange: -0.2, lastTradePrice: 0.4 })],
    });
    const lowMove = buildEvent("Low Move", [{ id: "3", slug: "crypto", label: "Crypto" }], {
      markets: [buildMarket({ oneDayPriceChange: 0.04, lastTradePrice: 0.55 })],
    });

    const items = selectBreakingItems([lowMove, mediumMove, highMove], 2);

    expect(items.map((item) => item.event.title)).toEqual([
      "High Move",
      "Medium Move",
    ]);
    expect(items[0]?.currentPrice).toBe(0.71);
  });
});

describe("collectTrendingTopics", () => {
  it("aggregates non-generic visible tags by volume", () => {
    const iranEvent = buildEvent(
      "Iran headline",
      [
        { id: "1", slug: "politics", label: "Politics" },
        { id: "2", slug: "iran", label: "Iran" },
      ],
      { volume24hr: 1_000 },
    );
    const aiEvent = buildEvent(
      "AI headline",
      [
        { id: "3", slug: "featured", label: "Featured" },
        { id: "4", slug: "ai", label: "AI" },
      ],
      { volume24hr: 600 },
    );

    expect(collectTrendingTopics([aiEvent, iranEvent], 3)).toEqual([
      { slug: "iran", label: "Iran", totalVolume: 1_000, eventCount: 1 },
      { slug: "ai", label: "AI", totalVolume: 600, eventCount: 1 },
    ]);
  });
});

describe("getPrimaryMarket", () => {
  it("prefers the market with the strongest move, then volume", () => {
    const market = getPrimaryMarket(
      buildEvent(
        "Primary market event",
        [{ id: "1", slug: "crypto", label: "Crypto" }],
        {
          markets: [
            buildMarket({ id: "a", oneDayPriceChange: 0.02, volumeNum: 5_000 }),
            buildMarket({ id: "b", oneDayPriceChange: -0.12, volumeNum: 4_000 }),
          ],
        },
      ),
    );

    expect(market?.id).toBe("b");
  });
});
