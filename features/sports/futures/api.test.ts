import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  PolymarketEvent,
  PolymarketMarket,
  PolymarketTag,
} from "@/features/events/types";
import { getSportsCardLeague } from "./parse";

const { listEventsKeyset } = vi.hoisted(() => ({
  listEventsKeyset: vi.fn(),
}));

vi.mock("@/features/events/api/gamma", () => ({
  listEventsKeyset,
}));

import { getSportsCardWorkingSet } from "./api";

const buildMarket = (
  id: string,
  overrides: Partial<PolymarketMarket> = {},
): PolymarketMarket => ({
  id,
  question: `Question ${id}`,
  conditionId: `condition-${id}`,
  slug: `market-${id}`,
  groupItemTitle: `Outcome ${id}`,
  outcomes: ["Yes", "No"],
  outcomePrices: [0.48, 0.52],
  clobTokenIds: [`${id}-yes`, `${id}-no`],
  volumeNum: 50_000,
  liquidityNum: 10_000,
  lastTradePrice: 0.48,
  bestBid: 0.47,
  bestAsk: 0.48,
  volume24hr: 5_000,
  oneDayPriceChange: 0.02,
  spread: 0.01,
  acceptingOrders: true,
  closed: false,
  ...overrides,
});

const buildEvent = ({
  id,
  slug,
  title,
  tags,
  restricted = false,
}: {
  id: string;
  slug: string;
  title: string;
  tags: PolymarketTag[];
  restricted?: boolean;
}): PolymarketEvent => ({
  id,
  ticker: title.slice(0, 3).toUpperCase(),
  slug,
  title,
  active: true,
  closed: false,
  archived: false,
  featured: false,
  restricted,
  liquidity: 100_000,
  volume: 1_000_000,
  volume24hr: 250_000,
  negRisk: false,
  showAllOutcomes: true,
  showMarketImages: false,
  markets: [
    buildMarket(`${id}-1`, {
      groupItemTitle: "Primary",
      lastTradePrice: 0.62,
      outcomePrices: [0.62, 0.38],
    }),
  ],
  tags,
});

describe("getSportsCardWorkingSet", () => {
  beforeEach(() => {
    listEventsKeyset.mockReset();
  });

  it("keeps public sports cards even when Gamma marks them restricted or force-hides the parent sports tag", async () => {
    listEventsKeyset.mockResolvedValueOnce({
      events: [
        buildEvent({
          id: "visible",
          slug: "2026-nba-champion",
          title: "2026 NBA Champion",
          tags: [
            { id: "1", slug: "sports", label: "Sports" },
            { id: "2", slug: "nba", label: "NBA" },
          ],
        }),
        buildEvent({
          id: "hide-tag",
          slug: "nba-mvp",
          title: "NBA MVP",
          tags: [
            { id: "3", slug: "sports", label: "Sports" },
            { id: "4", slug: "nba", label: "NBA" },
            { id: "5", slug: "hide-from-new", label: "Hide From New" },
          ],
        }),
        buildEvent({
          id: "force-hidden-taxonomy",
          slug: "hidden-taxonomy-market",
          title: "Hidden Taxonomy Market",
          tags: [
            { id: "6", slug: "sports", label: "Sports", forceHide: true },
            { id: "7", slug: "nba", label: "NBA" },
          ],
        }),
        buildEvent({
          id: "restricted",
          slug: "restricted-market",
          title: "Restricted Market",
          restricted: true,
          tags: [
            { id: "8", slug: "sports", label: "Sports" },
            { id: "9", slug: "nba", label: "NBA" },
          ],
        }),
      ],
      nextCursor: null,
    });

    const events = await getSportsCardWorkingSet();

    expect(events.map((event) => event.id)).toEqual([
      "visible",
      "hide-tag",
      "force-hidden-taxonomy",
      "restricted",
    ]);
  });

  it("keeps paging league routes until the league card set is substantial", async () => {
    for (let pageIndex = 0; pageIndex < 4; pageIndex += 1) {
      listEventsKeyset.mockResolvedValueOnce({
        events: Array.from({ length: 5 }, (_, cardIndex) =>
          buildEvent({
            id: `nba-${pageIndex}-${cardIndex}`,
            slug: `nba-${pageIndex}-${cardIndex}`,
            title: `NBA Card ${pageIndex}-${cardIndex}`,
            tags: [
              { id: "sports", slug: "sports", label: "Sports" },
              { id: "nba", slug: "nba", label: "NBA" },
            ],
          }),
        ),
        nextCursor: `cursor-${pageIndex}`,
      });
    }

    const events = await getSportsCardWorkingSet({
      desiredLeagueSlug: "nba",
    });

    expect(listEventsKeyset).toHaveBeenCalledTimes(3);
    expect(events).toHaveLength(15);
    expect(
      events.every((event) => getSportsCardLeague(event).slug === "nba"),
    ).toBe(true);
  });

  it("prefers the desired league feed before falling back to the broad sports feed", async () => {
    listEventsKeyset
      .mockResolvedValueOnce({
        events: [
          buildEvent({
            id: "nba-targeted",
            slug: "nba-targeted",
            title: "NBA Targeted Card",
            tags: [
              { id: "sports", slug: "sports", label: "Sports" },
              { id: "nba", slug: "nba", label: "NBA" },
            ],
          }),
        ],
        nextCursor: null,
      })
      .mockResolvedValueOnce({
        events: [
          buildEvent({
            id: "nhl-fallback",
            slug: "nhl-fallback",
            title: "NHL Fallback Card",
            tags: [
              { id: "sports", slug: "sports", label: "Sports" },
              { id: "nhl", slug: "nhl", label: "NHL" },
            ],
          }),
        ],
        nextCursor: null,
      });

    const events = await getSportsCardWorkingSet({
      desiredLeagueSlug: "NBA",
    });

    expect(listEventsKeyset).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ tagSlug: "nba" }),
    );
    expect(listEventsKeyset).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ tagSlug: "sports" }),
    );
    expect(events.map((event) => event.id)).toEqual(["nba-targeted", "nhl-fallback"]);
  });

  it("keeps paging the base futures surface until the league rail is broad enough", async () => {
    const leaguePages = [
      ["nba", "nhl", "epl"],
      ["ufc", "nfl", "mlb"],
      ["atp", "wta", "formula1"],
      ["golf", "boxing", "pickleball"],
      ["league-of-legends", "counter-strike-2", "dota-2"],
      ["nfl-draft", "cfb", "mls"],
      ["kbo", "pga", "ipl"],
      ["psl", "kbl", "cba"],
    ] as const;

    for (const [pageIndex, leagues] of leaguePages.entries()) {
      listEventsKeyset.mockResolvedValueOnce({
        events: leagues.map((leagueSlug) =>
          buildEvent({
            id: `${leagueSlug}-${pageIndex}`,
            slug: `${leagueSlug}-${pageIndex}`,
            title: `${leagueSlug} market`,
            tags: [
              { id: "sports", slug: "sports", label: "Sports" },
              {
                id: leagueSlug,
                slug: leagueSlug,
                label: leagueSlug.toUpperCase(),
              },
            ],
          }),
        ),
        nextCursor: `cursor-${pageIndex}`,
      });
    }

    const events = await getSportsCardWorkingSet();

    expect(listEventsKeyset).toHaveBeenCalledTimes(6);
    expect(new Set(events.map((event) => getSportsCardLeague(event).slug)).size).toBe(
      18,
    );
  });
});
