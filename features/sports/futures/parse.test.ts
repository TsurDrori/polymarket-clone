import { describe, expect, it } from "vitest";
import type {
  PolymarketEvent,
  PolymarketMarket,
  PolymarketTag,
} from "@/features/events/types";
import {
  buildHydrationEvents,
  buildSportsCards,
  formatSportsPct,
  isSportsCardEvent,
  selectCardsByLeague,
} from "./parse";

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
  outcomePrices: [0.5, 0.5],
  clobTokenIds: [`${id}-yes`, `${id}-no`],
  volumeNum: 50_000,
  liquidityNum: 10_000,
  lastTradePrice: 0.5,
  bestBid: 0.49,
  bestAsk: 0.51,
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
  markets,
}: {
  id: string;
  slug: string;
  title: string;
  tags: PolymarketTag[];
  markets?: PolymarketMarket[];
}): PolymarketEvent => ({
  id,
  ticker: title.slice(0, 3).toUpperCase(),
  slug,
  title,
  active: true,
  closed: false,
  archived: false,
  featured: false,
  restricted: false,
  liquidity: 100_000,
  volume: 1_000_000,
  volume24hr: 250_000,
  negRisk: false,
  showAllOutcomes: true,
  showMarketImages: false,
  markets:
    markets ??
    [
      buildMarket(`${id}-1`, {
        groupItemTitle: "Primary",
        lastTradePrice: 0.72,
        outcomePrices: [0.72, 0.28],
      }),
      buildMarket(`${id}-2`, {
        groupItemTitle: "Secondary",
        lastTradePrice: 0.18,
        outcomePrices: [0.18, 0.82],
      }),
    ],
  tags,
});

describe("sports futures parser", () => {
  it("excludes game events from futures and props surfaces", () => {
    const champion = buildEvent({
      id: "champion",
      slug: "2026-nba-champion",
      title: "2026 NBA Champion",
      tags: [
        { id: "1", slug: "sports", label: "Sports" },
        { id: "2", slug: "nba", label: "NBA" },
      ],
    });
    const game = buildEvent({
      id: "game",
      slug: "nba-hou-lal-2026-04-18",
      title: "Rockets vs. Lakers",
      tags: [
        { id: "3", slug: "sports", label: "Sports" },
        { id: "4", slug: "nba", label: "NBA" },
        { id: "5", slug: "games", label: "Games" },
      ],
      markets: [
        buildMarket("game-1", {
          groupItemTitle: "Moneyline",
          sportsMarketType: "moneyline",
        }),
      ],
    });

    expect(isSportsCardEvent(champion)).toBe(true);
    expect(isSportsCardEvent(game)).toBe(false);
    expect(buildSportsCards([champion, game], { previewLimit: 4 })).toHaveLength(1);
  });

  it("selects deterministic bounded previews by salience", () => {
    const event = buildEvent({
      id: "awards",
      slug: "nba-awards",
      title: "NBA Awards",
      tags: [
        { id: "1", slug: "sports", label: "Sports" },
        { id: "2", slug: "nba", label: "NBA" },
      ],
      markets: [
        buildMarket("first", {
          groupItemTitle: "First",
          lastTradePrice: 0.18,
          outcomePrices: [0.18, 0.82],
        }),
        buildMarket("second", {
          groupItemTitle: "Second",
          lastTradePrice: 0.62,
          outcomePrices: [0.62, 0.38],
        }),
        buildMarket("third", {
          groupItemTitle: "Third",
          lastTradePrice: 0.36,
          outcomePrices: [0.36, 0.64],
        }),
      ],
    });

    const [card] = buildSportsCards([event], { previewLimit: 2 });

    expect(card?.previewOutcomes.map((preview) => preview.label)).toEqual([
      "Second",
      "Third",
    ]);
  });

  it("filters cards by normalized league slug", () => {
    const cards = buildSportsCards(
      [
        buildEvent({
          id: "nba",
          slug: "2026-nba-champion",
          title: "2026 NBA Champion",
          tags: [
            { id: "1", slug: "sports", label: "Sports" },
            { id: "2", slug: "NBA", label: "NBA" },
          ],
        }),
        buildEvent({
          id: "nhl",
          slug: "2026-nhl-champion",
          title: "2026 NHL Champion",
          tags: [
            { id: "3", slug: "sports", label: "Sports" },
            { id: "4", slug: "nhl", label: "NHL" },
          ],
        }),
      ],
      { previewLimit: 4 },
    );

    const nbaCards = selectCardsByLeague(cards, "nba");

    expect(nbaCards).toHaveLength(1);
    expect(nbaCards[0]?.league.label).toBe("NBA");
  });

  it("hydrates only the preview token ids that are actually rendered", () => {
    const cards = buildSportsCards(
      [
        buildEvent({
          id: "champion",
          slug: "2026-nba-champion",
          title: "2026 NBA Champion",
          tags: [
            { id: "1", slug: "sports", label: "Sports" },
            { id: "2", slug: "nba", label: "NBA" },
          ],
          markets: [
            buildMarket("first", {
              groupItemTitle: "First",
              clobTokenIds: ["first-yes", "first-no"],
              outcomePrices: [0.72, 0.28],
              lastTradePrice: 0.72,
            }),
            buildMarket("second", {
              groupItemTitle: "Second",
              clobTokenIds: ["second-yes", "second-no"],
              outcomePrices: [0.18, 0.82],
              lastTradePrice: 0.18,
            }),
            buildMarket("third", {
              groupItemTitle: "Third",
              clobTokenIds: ["third-yes", "third-no"],
              outcomePrices: [0.09, 0.91],
              lastTradePrice: 0.09,
            }),
          ],
        }),
      ],
      { previewLimit: 2 },
    );

    const hydrationEvents = buildHydrationEvents(cards);

    expect(
      hydrationEvents.flatMap((event) => event.markets.flatMap((market) => market.clobTokenIds)),
    ).toEqual(["first-yes", "first-no", "second-yes", "second-no"]);
  });

  it("formats sub-one-percent outcomes like the public sports pages", () => {
    expect(formatSportsPct(0.009)).toBe("<1%");
    expect(formatSportsPct(0.48)).toBe("48%");
  });
});
