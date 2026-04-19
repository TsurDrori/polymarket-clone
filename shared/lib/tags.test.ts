import { describe, expect, it } from "vitest";
import type { PolymarketEvent, PolymarketMarket, PolymarketTag } from "@/features/events/types";
import { getVisibleTags, hasTagSlug, isEventVisible } from "./tags";

const market: PolymarketMarket = {
  id: "market-1",
  question: "Will something happen?",
  conditionId: "condition-1",
  slug: "will-something-happen",
  outcomes: ["Yes", "No"],
  outcomePrices: [0.6, 0.4],
  clobTokenIds: ["yes-token", "no-token"],
  volumeNum: 1000,
  liquidityNum: 500,
  lastTradePrice: 0.6,
  bestBid: 0.59,
  bestAsk: 0.61,
  volume24hr: 100,
  oneDayPriceChange: 0.02,
  spread: 0.02,
  acceptingOrders: true,
  closed: false,
};

const buildEvent = (tags: PolymarketTag[]): PolymarketEvent => ({
  id: "event-1",
  ticker: "EVT",
  slug: "sample-event",
  title: "Sample Event",
  active: true,
  closed: false,
  archived: false,
  featured: false,
  restricted: false,
  liquidity: 1000,
  volume: 5000,
  volume24hr: 500,
  negRisk: false,
  showAllOutcomes: false,
  showMarketImages: false,
  markets: [market],
  tags,
});

describe("getVisibleTags", () => {
  it("filters out force-hidden and hide-from-new tags", () => {
    const event = buildEvent([
      { id: "1", slug: "politics", label: "Politics", forceHide: true },
      { id: "2", slug: "hide-from-new", label: "Hide From New" },
      { id: "3", slug: "crypto", label: "Crypto" },
    ]);

    expect(getVisibleTags(event).map((tag) => tag.slug)).toEqual(["crypto"]);
  });
});

describe("hasTagSlug", () => {
  it("returns true when the tag is present", () => {
    const event = buildEvent([{ id: "1", slug: "sports", label: "Sports" }]);
    expect(hasTagSlug(event, "sports")).toBe(true);
  });

  it("returns false when the tag is absent", () => {
    const event = buildEvent([{ id: "1", slug: "sports", label: "Sports" }]);
    expect(hasTagSlug(event, "crypto")).toBe(false);
  });
});

describe("isEventVisible", () => {
  it("keeps events visible when they only contain force-hidden tags", () => {
    const event = buildEvent([
      { id: "1", slug: "politics", label: "Politics", forceHide: true },
      { id: "2", slug: "world", label: "World" },
    ]);

    expect(isEventVisible(event)).toBe(true);
  });

  it("hides events carrying the explicit hide-from-new slug", () => {
    const event = buildEvent([
      { id: "1", slug: "hide-from-new", label: "Hide From New" },
      { id: "2", slug: "sports", label: "Sports" },
    ]);

    expect(isEventVisible(event)).toBe(false);
  });
});
