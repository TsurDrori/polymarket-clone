import { describe, expect, it } from "vitest";
import type {
  PolymarketEvent,
  PolymarketMarket,
  PolymarketTag,
  PolymarketTeam,
} from "@/features/events/types";
import {
  buildHomeCardModel,
  buildHomeExploreCardEntries,
  resolveHomeCardFamily,
} from "./homeCardModel";

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

  it("keeps non-matchup sports yes/no markets on the binary widget manifestation", () => {
    const event = buildEvent(
      "Will Victor Wembanyama record a quadruple double this season?",
      [
        { id: "1", slug: "sports", label: "Sports" },
        { id: "2", slug: "nba", label: "NBA" },
      ],
      {
        eventMetadata: { league: "NBA" },
        markets: [
          buildMarket({
            id: "wemby-prop",
            question: "Will Victor Wembanyama record a quadruple double this season?",
            outcomes: ["Yes", "No"],
            lastTradePrice: 0.03,
            outcomePrices: [0.03, 0.97],
          }),
        ],
      },
    );

    const model = buildHomeCardModel(event);
    expect(resolveHomeCardFamily(event)).toBe("binary");
    expect(model.kind).toBe("binary");
    expect(model.kind === "binary" ? model.theme : "general").toBe("sports");
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

  it("resolves sports live cards only for matchup/game semantics", () => {
    const teams: PolymarketTeam[] = [
      { name: "Hawks", abbreviation: "Hawks", record: "31-20" },
      { name: "Knicks", abbreviation: "Knicks", record: "40-11" },
    ];
    const event = buildEvent(
      "Hawks vs Knicks",
      [
        { id: "1", slug: "sports", label: "Sports" },
        { id: "2", slug: "nba", label: "NBA" },
      ],
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
      "Hawks",
      "Knicks",
    ]);
  });

  it("curates the first four explore cards around politics, world, crypto, and sports", () => {
    const politics = buildEvent(
      "Politics card",
      [{ id: "politics", slug: "politics", label: "Politics" }],
      { id: "politics-card", featured: true, volume24hr: 10_000 },
    );
    const world = buildEvent(
      "World card",
      [
        { id: "world", slug: "world", label: "World" },
        { id: "geopolitics", slug: "geopolitics", label: "Geopolitics" },
      ],
      { id: "world-card", featured: true, volume24hr: 9_000 },
    );
    const crypto = buildEvent(
      "BTC 5 Minute Up or Down",
      [
        { id: "crypto", slug: "crypto", label: "Crypto" },
        { id: "up-or-down", slug: "up-or-down", label: "Up or Down" },
      ],
      {
        id: "crypto-card",
        featured: true,
        volume24hr: 8_000,
      },
    );
    const sports = buildEvent(
      "Knicks vs Hawks",
      [{ id: "sports", slug: "sports", label: "Sports" }],
      {
        id: "sports-card",
        featured: true,
        volume24hr: 7_000,
        eventMetadata: { league: "NBA" },
        teams: [
          { name: "Knicks", abbreviation: "Knicks" },
          { name: "Hawks", abbreviation: "Hawks" },
        ],
        markets: [
          buildMarket({
            id: "sports-market",
            sportsMarketType: "moneyline",
            outcomes: ["Knicks", "Hawks"],
          }),
        ],
      },
    );

    const entries = buildHomeExploreCardEntries({
      events: [politics, world, crypto, sports],
      cryptoEvents: [crypto],
      sportsEvents: [
        {
          id: sports.id,
          slug: sports.slug,
          title: sports.title,
          startTime: sports.startDate,
          endDate: sports.endDate,
          volume: sports.volume,
          volume24hr: sports.volume24hr,
          live: false,
          ended: false,
          image: sports.image,
          icon: sports.icon,
          tags: sports.tags,
          teams: sports.teams ?? [],
          eventMetadata: sports.eventMetadata,
          markets: sports.markets.map((market) => ({
            ...market,
            line: market.line ?? null,
          })),
        },
      ],
      limit: 8,
    });

    expect(entries.slice(0, 4).map((entry) => entry.id)).toEqual([
      "politics-card",
      "world-card",
      "crypto-card",
      "sports-card",
    ]);
  });

  it("prefers a current tradable crypto up/down card over a stale near-resolved one", () => {
    const staleCrypto = buildEvent(
      "Bitcoin Up or Down - April 20, 11PM ET",
      [
        { id: "crypto", slug: "crypto", label: "Crypto" },
        { id: "up-or-down", slug: "up-or-down", label: "Up or Down" },
        { id: "bitcoin", slug: "bitcoin", label: "Bitcoin" },
      ],
      {
        id: "stale-crypto",
        startDate: "2026-04-20T23:00:00.000Z",
        endDate: "2026-04-21T00:00:00.000Z",
        volume24hr: 90_000,
        markets: [
          buildMarket({
            outcomes: ["Up", "Down"],
            lastTradePrice: 0.999,
            bestBid: 0.999,
            bestAsk: 1,
          }),
        ],
      },
    );
    const currentCrypto = buildEvent(
      "Bitcoin Up or Down - April 21, 1AM ET",
      [
        { id: "crypto", slug: "crypto", label: "Crypto" },
        { id: "up-or-down", slug: "up-or-down", label: "Up or Down" },
        { id: "bitcoin", slug: "bitcoin", label: "Bitcoin" },
      ],
      {
        id: "current-crypto",
        startDate: "2026-04-21T01:00:00.000Z",
        endDate: "2026-04-21T02:00:00.000Z",
        volume24hr: 50_000,
        markets: [
          buildMarket({
            outcomes: ["Up", "Down"],
            lastTradePrice: 0.61,
            bestBid: 0.6,
            bestAsk: 0.62,
          }),
        ],
      },
    );

    const entries = buildHomeExploreCardEntries({
      events: [],
      cryptoEvents: [staleCrypto, currentCrypto],
      sportsEvents: [],
      limit: 2,
    });

    expect(entries[0]?.id).toBe("current-crypto");
    expect(entries[0]?.model.kind).toBe("crypto-up-down");
    expect(
      entries[0]?.model.kind === "crypto-up-down" ? entries[0].model.price : null,
    ).toBe(0.61);
  });

  it("prefers the higher-volume live crypto card when multiple tradable sessions exist", () => {
    const lowerVolume = buildEvent(
      "Bitcoin Up or Down - April 21, 1AM ET",
      [
        { id: "crypto", slug: "crypto", label: "Crypto" },
        { id: "up-or-down", slug: "up-or-down", label: "Up or Down" },
        { id: "bitcoin", slug: "bitcoin", label: "Bitcoin" },
        { id: "5m", slug: "5m", label: "5M" },
      ],
      {
        id: "btc-low-volume",
        volume24hr: 120_000,
        markets: [
          buildMarket({
            outcomes: ["Up", "Down"],
            lastTradePrice: 0.59,
            bestBid: 0.58,
            bestAsk: 0.6,
          }),
        ],
      },
    );
    const higherVolume = buildEvent(
      "Bitcoin Up or Down - April 21, 1:05AM ET",
      [
        { id: "crypto", slug: "crypto", label: "Crypto" },
        { id: "up-or-down", slug: "up-or-down", label: "Up or Down" },
        { id: "bitcoin", slug: "bitcoin", label: "Bitcoin" },
        { id: "5m", slug: "5m", label: "5M" },
      ],
      {
        id: "btc-high-volume",
        volume24hr: 480_000,
        markets: [
          buildMarket({
            outcomes: ["Up", "Down"],
            lastTradePrice: 0.57,
            bestBid: 0.56,
            bestAsk: 0.58,
          }),
        ],
      },
    );

    const entries = buildHomeExploreCardEntries({
      events: [],
      cryptoEvents: [lowerVolume, higherVolume],
      sportsEvents: [],
      limit: 2,
    });

    expect(entries[0]?.id).toBe("btc-high-volume");
  });

  it("replaces stale homepage crypto cards in the initial curated mix", () => {
    const staleCrypto = buildEvent(
      "Bitcoin Up or Down - April 20, 11PM ET",
      [
        { id: "crypto", slug: "crypto", label: "Crypto" },
        { id: "up-or-down", slug: "up-or-down", label: "Up or Down" },
        { id: "bitcoin", slug: "bitcoin", label: "Bitcoin" },
      ],
      {
        id: "stale-crypto-feed",
        featured: true,
        startDate: "2026-04-20T23:00:00.000Z",
        endDate: "2026-04-21T04:00:00.000Z",
        volume24hr: 90_000,
        markets: [
          buildMarket({
            outcomes: ["Up", "Down"],
            lastTradePrice: 0.999,
            bestBid: 0.999,
            bestAsk: 1,
          }),
        ],
      },
    );
    const currentCrypto = buildEvent(
      "Bitcoin Up or Down - April 21, 1AM ET",
      [
        { id: "crypto", slug: "crypto", label: "Crypto" },
        { id: "up-or-down", slug: "up-or-down", label: "Up or Down" },
        { id: "bitcoin", slug: "bitcoin", label: "Bitcoin" },
      ],
      {
        id: "current-crypto-feed",
        startDate: "2026-04-21T01:00:00.000Z",
        endDate: "2026-04-21T06:00:00.000Z",
        volume24hr: 10_000,
        markets: [
          buildMarket({
            outcomes: ["Up", "Down"],
            lastTradePrice: 0.61,
            bestBid: 0.6,
            bestAsk: 0.62,
          }),
        ],
      },
    );

    const entries = buildHomeExploreCardEntries({
      events: [staleCrypto],
      cryptoEvents: [staleCrypto, currentCrypto],
      sportsEvents: [],
      limit: 4,
    });

    expect(entries.some((entry) => entry.id === "stale-crypto-feed")).toBe(false);
    expect(entries.some((entry) => entry.id === "current-crypto-feed")).toBe(true);
  });
});
