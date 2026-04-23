import { afterEach, describe, expect, it, vi } from "vitest";
import { buildHomeChipFeedParams, getHomeChipFeedEvents, HOME_CHIP_EVENT_LIMIT } from "./chipFeed";

const { listEventsKeyset } = vi.hoisted(() => ({
  listEventsKeyset: vi.fn(),
}));

vi.mock("@/features/events/api/gamma", () => ({
  listEventsKeyset,
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("buildHomeChipFeedParams", () => {
  it("builds a volume-sorted feed request for topic chips", () => {
    expect(buildHomeChipFeedParams("nba")).toEqual({
      limit: HOME_CHIP_EVENT_LIMIT * 2,
      order: "volume_24hr",
      ascending: false,
      tagSlug: "nba",
    });
  });

  it("keeps the all feed broad without a tag filter", () => {
    expect(buildHomeChipFeedParams("all")).toEqual({
      limit: HOME_CHIP_EVENT_LIMIT * 2,
      order: "volume_24hr",
      ascending: false,
    });
  });
});

describe("getHomeChipFeedEvents", () => {
  it("filters hidden events out of fetched chip feeds", async () => {
    listEventsKeyset.mockResolvedValueOnce({
      events: [
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
      ],
      nextCursor: null,
    });

    const page = await getHomeChipFeedEvents("nba");

    expect(listEventsKeyset).toHaveBeenCalledWith(buildHomeChipFeedParams("nba"));
    expect(page.events.map((event) => event.id)).toEqual(["visible"]);
    expect(page.nextCursor).toBeNull();
  });

  it("keeps fetching until it fills a 20-card visible batch or exhausts the cursor chain", async () => {
    const buildEvent = (id: string, hidden = false) => ({
      id,
      slug: `${id}-market`,
      title: `${id} market`,
      ticker: `${id}-market`,
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
          id: `market-${id}`,
          question: `${id} market?`,
          conditionId: `condition-${id}`,
          slug: `${id}-market`,
          outcomes: ["Yes", "No"],
          outcomePrices: [0.5, 0.5],
          clobTokenIds: [`${id}-yes`, `${id}-no`],
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
      tags: hidden
        ? [
            { id: "topic", slug: "nba", label: "NBA" },
            { id: "hidden", slug: "hide-from-new", label: "Hide" },
          ]
        : [{ id: "topic", slug: "nba", label: "NBA" }],
    });

    listEventsKeyset
      .mockResolvedValueOnce({
        events: Array.from({ length: 8 }, (_, index) => buildEvent(`hidden-${index}`, true)),
        nextCursor: "cursor-2",
      })
      .mockResolvedValueOnce({
        events: Array.from({ length: 20 }, (_, index) => buildEvent(`visible-${index}`)),
        nextCursor: "cursor-3",
      });

    const page = await getHomeChipFeedEvents("nba");

    expect(listEventsKeyset).toHaveBeenCalledTimes(2);
    expect(page.events).toHaveLength(HOME_CHIP_EVENT_LIMIT);
    expect(page.events[0]?.id).toBe("visible-0");
    expect(page.events.at(-1)?.id).toBe("visible-19");
    expect(page.nextCursor).toBe("cursor-3");
  });
});
