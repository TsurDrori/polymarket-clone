import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getSportsGamesWorkingSet,
  getSportsLiveInitialPageEvents,
} from "./api";

vi.mock("next/cache", () => ({
  unstable_cache:
    <T extends (...args: never[]) => unknown>(fn: T) =>
    (...args: Parameters<T>) =>
      fn(...args),
}));

type MockFetchPayload = {
  events: unknown[];
  next_cursor?: string | null;
};

const buildRawMoneylineMarket = (id: string) => ({
  id,
  question: "Rockets vs. Lakers",
  sportsMarketType: "moneyline",
  outcomes: '["Rockets","Lakers"]',
  outcomePrices: '["0.36","0.64"]',
  clobTokenIds: '["rockets","lakers"]',
  lastTradePrice: "0.36",
  bestBid: "0.35",
  bestAsk: "0.37",
  volume: "5000",
  volume24hr: "1500",
  acceptingOrders: true,
  closed: false,
});

const buildRawEvent = (
  id: string,
  overrides: Partial<{
    slug: string;
    title: string;
    tags: Array<{ id: string; slug: string; label: string }>;
    markets: unknown[];
  }> = {},
) => ({
  id,
  slug: overrides.slug ?? `event-${id}`,
  title: overrides.title ?? `Event ${id}`,
  startTime: "2026-04-19T17:00:00.000Z",
  endDate: "2026-04-19T17:00:00.000Z",
  volume: "20000",
  volume24hr: "10000",
  live: false,
  ended: false,
  tags: overrides.tags ?? [
    { id: "sports", slug: "sports", label: "Sports" },
    { id: "games", slug: "games", label: "Games" },
    { id: "nba", slug: "nba", label: "NBA" },
  ],
  markets: overrides.markets ?? [buildRawMoneylineMarket(`market-${id}`)],
});

const createFetchResponse = (payload: MockFetchPayload): Response =>
  ({
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => payload,
  }) as Response;

describe("getSportsGamesWorkingSet", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("filters '-more-markets' pseudo-events from the working set", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        createFetchResponse({
          events: [
            buildRawEvent("primary", {
              slug: "nba-hou-lal-2026-04-18",
              title: "Rockets vs. Lakers",
            }),
            buildRawEvent("pseudo", {
              slug: "epl-eve-liv-2026-04-19-more-markets",
              title: "Everton FC vs. Liverpool FC - More Markets",
            }),
          ],
          next_cursor: null,
        }),
      );

    const events = await getSportsGamesWorkingSet();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(events.map((event) => event.slug)).toEqual(["nba-hou-lal-2026-04-18"]);
  });

  it("keeps paginating the all-sports route past a single tiny slice", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    for (let pageIndex = 0; pageIndex < 3; pageIndex += 1) {
      fetchMock.mockResolvedValueOnce(
        createFetchResponse({
          events: Array.from({ length: 250 }, (_, eventIndex) =>
            buildRawEvent(`${pageIndex}-${eventIndex}`),
          ),
          next_cursor: pageIndex === 2 ? null : `cursor-${pageIndex + 1}`,
        }),
      );
    }

    const events = await getSportsGamesWorkingSet();

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(events).toHaveLength(750);
  });

  it("supports a cached single-page sports-live slice for the initial route paint", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        createFetchResponse({
          events: Array.from({ length: 250 }, (_, eventIndex) =>
            buildRawEvent(`initial-${eventIndex}`),
          ),
          next_cursor: "cursor-1",
        }),
      );

    const payload = await getSportsLiveInitialPageEvents();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("tag_slug=games"),
      { cache: "no-store" },
    );
    expect(payload.events).toHaveLength(250);
    expect(payload.hasMorePages).toBe(true);
  });
});
