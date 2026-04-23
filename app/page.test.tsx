import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PolymarketEvent } from "@/features/events/types";

const {
  listEvents,
  listEventsKeyset,
  HomePage,
  Hydrator,
  buildHomePageModel,
  buildHomeExploreCardEntries,
  getHomeSportsGamePreviewEvents,
} = vi.hoisted(() => ({
  listEvents: vi.fn(),
  listEventsKeyset: vi.fn(),
  HomePage: vi.fn(() => null),
  Hydrator: vi.fn(() => null),
  buildHomePageModel: vi.fn(),
  buildHomeExploreCardEntries: vi.fn(),
  getHomeSportsGamePreviewEvents: vi.fn(),
}));

vi.mock("@/features/events/api/gamma", () => ({
  listEvents,
  listEventsKeyset,
}));

vi.mock("@/features/home/HomePage", () => ({
  HomePage,
}));

vi.mock("@/features/realtime/Hydrator", () => ({
  Hydrator,
}));

vi.mock("@/features/home/selectors", () => ({
  buildHomePageModel,
}));

vi.mock("@/features/home/components/homeCardModel", () => ({
  buildHomeExploreCardEntries,
}));

vi.mock("@/features/sports/games/api", () => ({
  getHomeSportsGamePreviewEvents,
}));

import Home from "./page";

const buildEvent = (
  id: string,
  tagSlug = "news",
  overrides: Partial<PolymarketEvent> = {},
): PolymarketEvent => ({
  id,
  ticker: id.toUpperCase(),
  slug: `${id}-slug`,
  title: `${id} title`,
  active: true,
  closed: false,
  archived: false,
  featured: false,
  restricted: false,
  liquidity: 10_000,
  volume: 50_000,
  volume24hr: 25_000,
  negRisk: false,
  showAllOutcomes: true,
  showMarketImages: false,
  markets: [
    {
      id: `${id}-market`,
      question: `${id} question`,
      conditionId: `${id}-condition`,
      slug: `${id}-market-slug`,
      outcomes: ["Yes", "No"],
      outcomePrices: [0.55, 0.45],
      clobTokenIds: [`${id}-yes`, `${id}-no`],
      volumeNum: 10_000,
      liquidityNum: 5_000,
      lastTradePrice: 0.55,
      bestBid: 0.54,
      bestAsk: 0.56,
      volume24hr: 4_000,
      oneDayPriceChange: 0.01,
      spread: 0.01,
      acceptingOrders: true,
      closed: false,
    },
  ],
  tags: [{ id: `${id}-tag`, slug: tagSlug, label: tagSlug }],
  ...overrides,
});

describe("Home route", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    listEvents.mockResolvedValue([]);
    listEventsKeyset.mockReset();
    getHomeSportsGamePreviewEvents.mockResolvedValue([]);
    buildHomePageModel.mockReturnValue({
      hero: { spotlights: [], contextChips: [] },
      marketChips: [{ slug: "all", label: "All" }],
      exploreEvents: [],
    });
    buildHomeExploreCardEntries.mockReturnValue([
      { id: "card-a", hydrationSeeds: [] },
      { id: "card-b", hydrationSeeds: [] },
    ]);
    listEventsKeyset.mockResolvedValue({
      events: [],
      nextCursor: null,
    });
    listEvents.mockImplementation(async ({ tagSlug }: { tagSlug?: string }) => {
      if (tagSlug === "crypto") {
        return [buildEvent("crypto-1", "crypto")];
      }

      if (tagSlug === "sports") {
        return [buildEvent("sports-1", "sports")];
      }

      return [];
    });
    getHomeSportsGamePreviewEvents.mockResolvedValue([
      { ...buildEvent("game-1", "sports"), teams: [{ name: "A" }, { name: "B" }] },
    ]);
  });

  it("uses the same all-markets keyset feed for initial cards and the continuation cursor", async () => {
    const topFeedEvents = [buildEvent("top-1"), buildEvent("top-2")];
    const allFeedEvents = Array.from({ length: 20 }, (_, index) =>
      buildEvent(`all-${index + 1}`),
    );

    listEventsKeyset
      .mockResolvedValueOnce({
        events: topFeedEvents,
        nextCursor: "top-cursor",
      })
      .mockResolvedValueOnce({
        events: allFeedEvents,
        nextCursor: "all-cursor",
      });

    render(await Home());

    expect(listEventsKeyset).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        limit: 8,
        order: "volume_24hr",
        ascending: false,
      }),
    );
    expect(listEventsKeyset).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        limit: 40,
        order: "volume_24hr",
        ascending: false,
      }),
    );
    expect(buildHomeExploreCardEntries).toHaveBeenCalledWith(
      expect.objectContaining({
        events: allFeedEvents,
        limit: 20,
      }),
    );
    expect(HomePage).toHaveBeenCalledWith(
      expect.objectContaining({
        initialExploreCards: expect.any(Array),
        initialExploreCursor: "all-cursor",
      }),
      undefined,
    );
  });
});
