import { describe, expect, it } from "vitest";
import type {
  PolymarketEvent,
  PolymarketMarket,
  PolymarketTag,
} from "@/features/events/types";
import {
  buildHomeHeroModel,
  buildHomePageModel,
  collectTrendingTopics,
  getPrimaryMarket,
  selectHeroBreaking,
  selectSpotlightEvent,
  selectSpotlightEvents,
} from "./selectors";

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
  endDate: overrides.endDate,
  image: overrides.image,
  icon: overrides.icon,
  active: overrides.active ?? true,
  closed: overrides.closed ?? false,
  archived: overrides.archived ?? false,
  featured: overrides.featured ?? false,
  restricted: overrides.restricted ?? false,
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
  eventMetadata: overrides.eventMetadata,
});

describe("selectSpotlightEvent", () => {
  it("prefers a featured non-sports event with real description copy", () => {
    const sports = buildEvent(
      "Knicks vs. Celtics",
      [
        { id: "sports", slug: "sports", label: "Sports" },
        { id: "games", slug: "games", label: "Games" },
      ],
      {
        featured: true,
        volume24hr: 800_000,
        description: "A high-volume sports event, but not the preferred desktop hero.",
      },
    );
    const politics = buildEvent(
      "Strait of Hormuz traffic returns to normal?",
      [
        { id: "economy", slug: "economy", label: "Economy" },
        { id: "ships", slug: "ships", label: "Ships" },
      ],
      {
        featured: true,
        volume24hr: 780_000,
        description:
          "Ships resumed normal transit through the Strait after the latest regional warning. Resolution depends on continued unrestricted commercial passage.",
      },
    );

    expect(selectSpotlightEvent([sports, politics])?.id).toBe(politics.id);
  });
});

describe("getPrimaryMarket", () => {
  it("prefers the chart-worthy market with the strongest move and token ids", () => {
    const market = getPrimaryMarket(
      buildEvent(
        "Primary market event",
        [{ id: "1", slug: "crypto", label: "Crypto" }],
        {
          markets: [
            buildMarket({
              id: "a",
              clobTokenIds: [],
              oneDayPriceChange: 0.32,
              volumeNum: 8_000,
            }),
            buildMarket({
              id: "b",
              oneDayPriceChange: -0.12,
              volumeNum: 12_000,
            }),
          ],
        },
      ),
    );

    expect(market?.id).toBe("b");
  });
});

describe("selectHeroBreaking", () => {
  it("returns the highest moving unique events and excludes the spotlight event", () => {
    const spotlight = buildEvent("Spotlight", [{ id: "1", slug: "tech", label: "Tech" }], {
      id: "spotlight",
      markets: [buildMarket({ oneDayPriceChange: 0.45 })],
    });
    const mediumMove = buildEvent("Medium Move", [{ id: "2", slug: "sports", label: "Sports" }], {
      markets: [buildMarket({ oneDayPriceChange: -0.2, lastTradePrice: 0.4 })],
    });
    const lowMove = buildEvent("Low Move", [{ id: "3", slug: "crypto", label: "Crypto" }], {
      markets: [buildMarket({ oneDayPriceChange: 0.04, lastTradePrice: 0.55 })],
    });

    const items = selectHeroBreaking([lowMove, mediumMove, spotlight], {
      excludeEventId: spotlight.id,
      limit: 2,
    });

    expect(items.map((item) => item.event.title)).toEqual([
      "Medium Move",
      "Low Move",
    ]);
  });
});

describe("collectTrendingTopics", () => {
  it("aggregates non-generic visible tags by volume", () => {
    const iranEvent = buildEvent(
      "Iran headline",
      [
        { id: "1", slug: "politics", label: "Politics" },
        { id: "2", slug: "iran", label: "Iran" },
      ],
      { volume24hr: 1_000 },
    );
    const aiEvent = buildEvent(
      "AI headline",
      [
        { id: "3", slug: "featured", label: "Featured" },
        { id: "4", slug: "ai", label: "AI" },
      ],
      { volume24hr: 600 },
    );

    expect(collectTrendingTopics([aiEvent, iranEvent], 3)).toEqual([
      { slug: "iran", label: "Iran", totalVolume: 1_000, eventCount: 1 },
      { slug: "ai", label: "AI", totalVolume: 600, eventCount: 1 },
    ]);
  });
});

describe("buildHomeHeroModel", () => {
  it("builds a spotlight-first hero with fallback-derived source rows and chips", () => {
    const event = buildEvent(
      "Strait of Hormuz traffic returns to normal?",
      [
        { id: "economy", slug: "economy", label: "Economy" },
        { id: "ships", slug: "ships", label: "Ships" },
      ],
      {
        featured: true,
        endDate: "2026-04-30T23:59:59.000Z",
        description:
          "Commercial shipping resumed after the latest disruption. This market resolves yes if normal transit holds through the listed date.",
      },
    );

    const hero = buildHomeHeroModel([event], {
      spotlightChart: {
        intervalLabel: "1W window",
        sourceLabel: "Polymarket CLOB",
        points: [
          { t: 1, p: 0.2 },
          { t: 2, p: 0.28 },
          { t: 3, p: 0.31 },
          { t: 4, p: 0.26 },
          { t: 5, p: 0.29 },
        ],
      },
    });

    expect(hero.spotlight?.sourceMode).toBe("fallback-derived");
    expect(hero.spotlight?.sourceRows.length).toBeGreaterThanOrEqual(3);
    expect(hero.spotlight?.outcomeMode).toBe("binary");
    expect(hero.spotlight?.outcomeItems).toHaveLength(2);
    expect(hero.contextChips[0]?.label).toBe("All");
    expect(hero.spotlight?.chart?.points).toHaveLength(5);
  });

  it("surfaces multi-market outcome rows for bracket-style events", () => {
    const event = buildEvent(
      "2026 Championship",
      [{ id: "sports", slug: "sports", label: "Sports" }],
      {
        featured: true,
        markets: [
          buildMarket({
            id: "market-a",
            question: "Will Team A win the championship?",
            groupItemTitle: "Team A",
            lastTradePrice: 0.42,
            volume24hr: 8_000,
          }),
          buildMarket({
            id: "market-b",
            question: "Will Team B win the championship?",
            groupItemTitle: "Team B",
            lastTradePrice: 0.27,
            volume24hr: 7_000,
          }),
          buildMarket({
            id: "market-c",
            question: "Will Team C win the championship?",
            groupItemTitle: "Team C",
            lastTradePrice: 0.16,
            volume24hr: 6_000,
          }),
        ],
      },
    );

    const hero = buildHomeHeroModel([event]);

    expect(hero.spotlight?.outcomeMode).toBe("multi-market");
    expect(hero.spotlight?.outcomeItems.map((outcome) => outcome.label)).toEqual([
      "Team A",
      "Team B",
      "Team C",
    ]);
  });
});

describe("selectSpotlightEvents", () => {
  it("fills the hero carousel with multi-market events before falling back to single markets", () => {
    const multiOne = buildEvent(
      "Multi One",
      [{ id: "economy", slug: "economy", label: "Economy" }],
      {
        featured: true,
        volume24hr: 900_000,
        markets: [
          buildMarket({ id: "m1-a", lastTradePrice: 0.46, volume24hr: 9_000 }),
          buildMarket({ id: "m1-b", lastTradePrice: 0.31, volume24hr: 8_000 }),
          buildMarket({ id: "m1-c", lastTradePrice: 0.18, volume24hr: 7_000 }),
        ],
      },
    );
    const multiTwo = buildEvent(
      "Multi Two",
      [{ id: "culture", slug: "culture", label: "Culture" }],
      {
        volume24hr: 800_000,
        markets: [
          buildMarket({ id: "m2-a", lastTradePrice: 0.39, volume24hr: 6_000 }),
          buildMarket({ id: "m2-b", lastTradePrice: 0.22, volume24hr: 5_000 }),
        ],
      },
    );
    const single = buildEvent(
      "Single",
      [{ id: "politics", slug: "politics", label: "Politics" }],
      {
        volume24hr: 700_000,
        markets: [buildMarket({ id: "single-a", lastTradePrice: 0.51, volume24hr: 12_000 })],
      },
    );

    const selected = selectSpotlightEvents([single, multiTwo, multiOne], 2);

    expect(selected.map((event) => event.title)).toEqual(["Multi One", "Multi Two"]);
  });
});

describe("buildHomePageModel", () => {
  it("keeps the homepage payload bounded for the server-rendered surface", () => {
    const events = Array.from({ length: 48 }, (_, index) =>
      buildEvent(
        `Market ${index + 1}`,
        [{ id: `tag-${index}`, slug: "politics", label: "Politics" }],
        {
          id: `event-${index + 1}`,
          featured: index === 0,
          volume24hr: 10_000 - index,
          description:
            index === 0
              ? "A strong lead item for the spotlight hero. Resolution depends on the listed date."
              : undefined,
        },
      ),
    );

    const model = buildHomePageModel(events);

    expect(model.hero.spotlight?.event.id).toBe("event-1");
    expect(model.hero.spotlights).toHaveLength(6);
    expect(model.hero.breaking).toHaveLength(3);
    expect(model.hero.topics.length).toBeLessThanOrEqual(5);
    expect(model.exploreEvents).toHaveLength(30);
  });
});
