import { describe, expect, it } from "vitest";
import type {
  SportsGameEvent,
  SportsGameMarket,
  SportsGameTag,
  SportsGameTeam,
} from "./parse";
import {
  buildLiveRouteSections,
  buildSportsGameRows,
  buildSportsPreviewHydrationSeeds,
  pickMoneylineMarket,
  pickSpreadMarket,
  pickTotalMarket,
  selectRowsByLeague,
} from "./parse";

const buildMarket = (
  overrides: Partial<SportsGameMarket> = {},
): SportsGameMarket => ({
  id: overrides.id ?? crypto.randomUUID(),
  question: overrides.question ?? "Rockets vs. Lakers",
  groupItemTitle: overrides.groupItemTitle,
  sportsMarketType: overrides.sportsMarketType,
  line: overrides.line ?? null,
  outcomes: overrides.outcomes ?? ["Rockets", "Lakers"],
  outcomePrices: overrides.outcomePrices ?? [0.36, 0.64],
  clobTokenIds: overrides.clobTokenIds ?? ["a", "b"],
  lastTradePrice: overrides.lastTradePrice ?? 0.36,
  bestBid: overrides.bestBid ?? 0.35,
  bestAsk: overrides.bestAsk ?? 0.37,
  volumeNum: overrides.volumeNum ?? 5_000,
  volume24hr: overrides.volume24hr ?? 1_500,
  acceptingOrders: overrides.acceptingOrders ?? true,
  closed: overrides.closed ?? false,
});

const buildTeams = (names: string[]): SportsGameTeam[] =>
  names.map((name) => ({
    name,
    abbreviation: name.slice(0, 3).toUpperCase(),
    record: "0-0",
  }));

const buildEvent = ({
  title = "Rockets vs. Lakers",
  tags = [
    { id: "sports", slug: "sports", label: "Sports" },
    { id: "games", slug: "games", label: "Games" },
    { id: "nba", slug: "nba", label: "NBA" },
  ],
  teams = buildTeams(["Rockets", "Lakers"]),
  markets = [buildMarket({ sportsMarketType: "moneyline" })],
  startTime = "2026-04-19T17:00:00.000Z",
  live = false,
  ended = false,
}: Partial<SportsGameEvent> = {}): SportsGameEvent => ({
  id: crypto.randomUUID(),
  slug: title.toLowerCase().replaceAll(/\s+/g, "-"),
  title,
  startTime,
  endDate: startTime,
  volume: 20_000,
  volume24hr: 10_000,
  live,
  ended,
  period: live ? "Q3 - 08:31" : undefined,
  score: ended ? "101-98" : undefined,
  eventWeek: 3,
  image: undefined,
  icon: undefined,
  tags: tags as SportsGameTag[],
  teams,
  eventMetadata: {
    tournament: "Playoffs",
  },
  markets,
});

describe("sports games parser", () => {
  it("selects the primary moneyline, spread, and total markets from mixed bundles", () => {
    const event = buildEvent({
      markets: [
        buildMarket({
          id: "alt-total",
          sportsMarketType: "totals",
          line: 214.5,
          question: "O/U 214.5",
          groupItemTitle: "O/U 214.5",
          outcomes: ["Over", "Under"],
          volume24hr: 200,
        }),
        buildMarket({
          id: "props",
          sportsMarketType: "points",
          question: "Player Points O/U 14.5",
          outcomes: ["Yes", "No"],
          clobTokenIds: ["props-yes", "props-no"],
        }),
        buildMarket({
          id: "moneyline",
          sportsMarketType: "moneyline",
          question: "Rockets vs. Lakers",
          volume24hr: 2_000,
        }),
        buildMarket({
          id: "spread",
          sportsMarketType: "spreads",
          question: "Spread: Rockets (-4.5)",
          groupItemTitle: "Spread -4.5",
          line: -4.5,
          volume24hr: 1_200,
        }),
        buildMarket({
          id: "total",
          sportsMarketType: "totals",
          question: "O/U 213.5",
          groupItemTitle: "O/U 213.5",
          line: 213.5,
          outcomes: ["Over", "Under"],
          volume24hr: 900,
        }),
        buildMarket({
          id: "first-half",
          sportsMarketType: "first_half_moneyline",
          question: "1H Moneyline",
          volume24hr: 1_800,
        }),
      ],
    });

    expect(pickMoneylineMarket(event)?.id).toBe("moneyline");
    expect(pickSpreadMarket(event)?.id).toBe("spread");
    expect(pickTotalMarket(event)?.id).toBe("total");
  });

  it("keeps sparse rows truthful instead of inventing missing markets", () => {
    const event = buildEvent({
      markets: [
        buildMarket({
          id: "moneyline",
          sportsMarketType: "moneyline",
          question: "Rockets vs. Lakers",
          outcomes: ["Rockets", "Lakers", "Draw"],
          outcomePrices: [0.31, 0.36, 0.33],
          clobTokenIds: ["rockets", "draw", "lakers"],
        }),
      ],
    });

    const [row] = buildSportsGameRows([event]);

    expect(row?.moneyline).toHaveLength(3);
    expect(row?.spread).toHaveLength(0);
    expect(row?.total).toHaveLength(0);
  });

  it("filters rows by normalized league slug", () => {
    const rows = buildSportsGameRows([
      buildEvent({
        title: "Rockets vs. Lakers",
        tags: [
          { id: "sports", slug: "sports", label: "Sports" },
          { id: "games", slug: "games", label: "Games" },
          { id: "nba", slug: "NBA", label: "NBA" },
          { id: "basketball", slug: "basketball", label: "Basketball" },
        ],
      }),
      buildEvent({
        title: "Maple Leafs vs. Rangers",
        tags: [
          { id: "sports", slug: "sports", label: "Sports" },
          { id: "games", slug: "games", label: "Games" },
          { id: "nhl", slug: "nhl", label: "NHL" },
        ],
      }),
    ]);

    const nbaRows = selectRowsByLeague(rows, "nba");

    expect(nbaRows).toHaveLength(1);
    expect(nbaRows[0]?.league.label).toBe("NBA");
  });

  it("hydrates only tokens from rendered live-preview rows", () => {
    const rows = buildSportsGameRows([
      buildEvent({
        title: "Game One",
        markets: [
          buildMarket({
            id: "game-one-moneyline",
            sportsMarketType: "moneyline",
            clobTokenIds: ["one-a", "one-b"],
          }),
        ],
      }),
      buildEvent({
        title: "Game Two",
        markets: [
          buildMarket({
            id: "game-two-moneyline",
            sportsMarketType: "moneyline",
            clobTokenIds: ["two-a", "two-b"],
          }),
        ],
      }),
    ]);

    const sections = buildLiveRouteSections(rows, { rowLimit: 1 });
    const seeds = buildSportsPreviewHydrationSeeds(
      sections.flatMap((section) => section.rows),
    );

    expect(seeds.map((seed) => seed.tokenId)).toEqual(["one-a", "one-b"]);
  });
});
