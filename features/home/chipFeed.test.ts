import { describe, expect, it, vi } from "vitest";
import { buildHomeChipFeedParams, getHomeChipFeedEvents, HOME_CHIP_EVENT_LIMIT } from "./chipFeed";

const { listEvents } = vi.hoisted(() => ({
  listEvents: vi.fn(),
}));

vi.mock("@/features/events/api/gamma", () => ({
  listEvents,
}));

describe("buildHomeChipFeedParams", () => {
  it("builds a volume-sorted feed request for topic chips", () => {
    expect(buildHomeChipFeedParams("nba")).toEqual({
      limit: HOME_CHIP_EVENT_LIMIT,
      order: "volume_24hr",
      ascending: false,
      tagSlug: "nba",
    });
  });

  it("keeps the all feed broad without a tag filter", () => {
    expect(buildHomeChipFeedParams("all")).toEqual({
      limit: HOME_CHIP_EVENT_LIMIT,
      order: "volume_24hr",
      ascending: false,
    });
  });
});

describe("getHomeChipFeedEvents", () => {
  it("filters hidden events out of fetched chip feeds", async () => {
    listEvents.mockResolvedValueOnce([
      {
        id: "visible",
        slug: "visible-market",
        title: "Visible market",
        ticker: "visible-market",
        active: true,
        closed: false,
        archived: false,
        featured: false,
        restricted: false,
        liquidity: 1,
        volume: 1,
        volume24hr: 1,
        negRisk: false,
        showAllOutcomes: false,
        showMarketImages: false,
        markets: [
          {
            id: "market-visible",
            question: "Visible market?",
            conditionId: "condition-visible",
            slug: "visible-market",
            outcomes: ["Yes", "No"],
            outcomePrices: [0.5, 0.5],
            clobTokenIds: ["yes", "no"],
            volumeNum: 1,
            liquidityNum: 1,
            lastTradePrice: 0.5,
            bestBid: 0.49,
            bestAsk: 0.51,
            volume24hr: 1,
            oneDayPriceChange: 0,
            spread: 0.01,
            acceptingOrders: true,
            closed: false,
          },
        ],
        tags: [{ id: "topic", slug: "nba", label: "NBA" }],
      },
      {
        id: "hidden",
        slug: "hidden-market",
        title: "Hidden market",
        ticker: "hidden-market",
        active: true,
        closed: false,
        archived: false,
        featured: false,
        restricted: false,
        liquidity: 1,
        volume: 1,
        volume24hr: 1,
        negRisk: false,
        showAllOutcomes: false,
        showMarketImages: false,
        markets: [
          {
            id: "market-hidden",
            question: "Hidden market?",
            conditionId: "condition-hidden",
            slug: "hidden-market",
            outcomes: ["Yes", "No"],
            outcomePrices: [0.5, 0.5],
            clobTokenIds: ["yes", "no"],
            volumeNum: 1,
            liquidityNum: 1,
            lastTradePrice: 0.5,
            bestBid: 0.49,
            bestAsk: 0.51,
            volume24hr: 1,
            oneDayPriceChange: 0,
            spread: 0.01,
            acceptingOrders: true,
            closed: false,
          },
        ],
        tags: [
          { id: "topic", slug: "nba", label: "NBA" },
          { id: "hidden", slug: "hide-from-new", label: "Hide" },
        ],
      },
    ]);

    const events = await getHomeChipFeedEvents("nba");

    expect(listEvents).toHaveBeenCalledWith(buildHomeChipFeedParams("nba"));
    expect(events.map((event) => event.id)).toEqual(["visible"]);
  });
});
