import { describe, expect, it } from "vitest";
import type {
  PolymarketEvent,
  PolymarketMarket,
  PolymarketTag,
  PolymarketTeam,
} from "@/features/events/types";
import { buildHomeCardModel, resolveHomeCardFamily } from "./homeCardModel";

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
  sportsMarketType: overrides.sportsMarketType,
  line: overrides.line ?? null,
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
  endDate: overrides.endDate ?? "2026-12-31T23:59:59.000Z",
  image: overrides.image,
  icon: overrides.icon,
  active: overrides.active ?? true,
  closed: overrides.closed ?? false,
  archived: overrides.archived ?? false,
  featured: overrides.featured ?? false,
  restricted: overrides.restricted ?? false,
  live: overrides.live,
  ended: overrides.ended,
  period: overrides.period,
  score: overrides.score,
  eventWeek: overrides.eventWeek,
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
  teams: overrides.teams,
  eventMetadata: overrides.eventMetadata,
});

describe("homeCardModel", () => {
  it("resolves binary cards for standard yes/no events", () => {
    const event = buildEvent("Will this happen?", [{ id: "1", slug: "tech", label: "Tech" }]);

    expect(resolveHomeCardFamily(event)).toBe("binary");
    expect(buildHomeCardModel(event).kind).toBe("binary");
  });

  it("resolves grouped cards for multi-market homepage events", () => {
    const event = buildEvent(
      "What will happen before GTA VI?",
      [{ id: "1", slug: "culture", label: "Culture" }],
      {
        showAllOutcomes: true,
        markets: [
          buildMarket({ id: "first", groupItemTitle: "July 31" }),
          buildMarket({ id: "second", groupItemTitle: "June 30" }),
          buildMarket({ id: "third", groupItemTitle: "April 30" }),
        ],
      },
    );

    const model = buildHomeCardModel(event);

    expect(resolveHomeCardFamily(event)).toBe("grouped");
    expect(model.kind).toBe("grouped");
    expect(model.kind === "grouped" ? model.rows.map((row) => row.label) : []).toEqual([
      "July 31",
      "June 30",
    ]);
  });

  it("resolves crypto up/down cards from crypto-specific events", () => {
    const event = buildEvent(
      "BTC 5 Minute Up or Down",
      [
        { id: "1", slug: "crypto", label: "Crypto" },
        { id: "2", slug: "up-or-down", label: "Up or Down" },
        { id: "3", slug: "bitcoin", label: "Bitcoin" },
      ],
      {
        markets: [
          buildMarket({
            outcomes: ["Up", "Down"],
            lastTradePrice: 0.52,
          }),
        ],
      },
    );

    const model = buildHomeCardModel(event);
    expect(resolveHomeCardFamily(event)).toBe("crypto-up-down");
    expect(model.kind).toBe("crypto-up-down");
    expect(model.kind === "crypto-up-down" ? model.actions[0].label : "").toBe("Up");
  });

  it("resolves sports cards for matchup events even before tipoff", () => {
    const teams: PolymarketTeam[] = [
      { name: "Hawks", abbreviation: "Hawks", record: "31-20" },
      { name: "Knicks", abbreviation: "Knicks", record: "40-11" },
    ];
    const event = buildEvent(
      "Hawks vs Knicks",
      [{ id: "1", slug: "nba", label: "NBA" }],
      {
        live: false,
        period: "3:00 AM",
        teams,
        eventMetadata: { league: "nba" },
        markets: [
          buildMarket({
            id: "hawks",
            question: "Hawks moneyline",
            outcomes: ["Hawks", "Knicks"],
            sportsMarketType: "moneyline",
            lastTradePrice: 0.31,
          }),
        ],
      },
    );

    const model = buildHomeCardModel(event);
    expect(resolveHomeCardFamily(event)).toBe("sports-live");
    expect(model.kind).toBe("sports-live");
    expect(model.kind === "sports-live" ? model.competitors.map((team) => team.name) : []).toEqual([
      "HAWKS",
      "KNICKS",
    ]);
  });
});
