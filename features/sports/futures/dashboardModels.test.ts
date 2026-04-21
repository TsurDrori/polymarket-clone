import { describe, expect, it, vi } from "vitest";
import type { PolymarketEvent, PolymarketMarket } from "@/features/events/types";

const { getEventBySlug } = vi.hoisted(() => ({
  getEventBySlug: vi.fn(),
}));

const { getSportsFuturesPopularCounts } = vi.hoisted(() => ({
  getSportsFuturesPopularCounts: vi.fn(),
}));

vi.mock("@/features/events/api/gamma", () => ({
  getEventBySlug,
}));

vi.mock("./liveContract", async () => {
  const actual = await vi.importActual<typeof import("./liveContract")>("./liveContract");
  return {
    ...actual,
    getSportsFuturesPopularCounts,
  };
});

import { getSportsLeagueDashboardPayload } from "./dashboardModels";

const buildMarket = (
  id: string,
  label: string,
  price: number,
): PolymarketMarket => ({
  id,
  question: `Will ${label} win?`,
  conditionId: `condition-${id}`,
  slug: `slug-${id}`,
  groupItemTitle: label,
  outcomes: ["Yes", "No"],
  outcomePrices: [price, 1 - price],
  clobTokenIds: [`${id}-yes`, `${id}-no`],
  volumeNum: 1000,
  liquidityNum: 1000,
  lastTradePrice: price,
  bestBid: price - 0.01,
  bestAsk: price + 0.01,
  volume24hr: 500,
  oneDayPriceChange: 0,
  spread: 0.01,
  acceptingOrders: true,
  closed: false,
});

const buildEvent = (
  slug: string,
  title: string,
  markets: PolymarketMarket[],
): PolymarketEvent => ({
  id: slug,
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
  markets,
  tags: [
    { id: "sports", slug: "sports", label: "Sports" },
    { id: "nba", slug: "nba", label: "NBA" },
  ],
});

describe("sports league dashboard payload", () => {
  it("builds the curated NBA contract with sorted outcomes and rail counts", async () => {
    getSportsFuturesPopularCounts.mockResolvedValueOnce({
      nba: 22,
      ucl: 8,
      nhl: 24,
      ufc: 37,
      epl: 83,
      nfl: 1,
    });

    getEventBySlug.mockImplementation(async (slug: string) => {
      switch (slug) {
        case "2026-nba-champion":
          return buildEvent(slug, "2026 NBA Champion", [
            buildMarket("okc", "Oklahoma City Thunder", 0.49),
            buildMarket("bos", "Boston Celtics", 0.14),
            buildMarket("sas", "San Antonio Spurs", 0.15),
          ]);
        case "nba-mvp-694":
          return buildEvent(slug, "NBA MVP", [
            buildMarket("sga", "Shai Gilgeous-Alexander", 0.96),
            buildMarket("wemby", "Viktor Wembanyama", 0.02),
          ]);
        case "nba-rookie-of-the-year-873":
          return buildEvent(slug, "Rookie of the Year", [
            buildMarket("flagg", "Cooper Flagg", 0.78),
            buildMarket("knueppel", "Kon Knueppel", 0.19),
          ]);
        case "nba-cup-winner-164":
          return buildEvent(slug, "NBA Cup Winner", [
            buildMarket("knicks", "New York Knicks", 1),
            buildMarket("hawks", "Atlanta Hawks", 0),
          ]);
        case "nba-eastern-conference-champion-442":
          return buildEvent(slug, "Eastern Conference Champion", [
            buildMarket("celtics", "Boston Celtics", 0.44),
            buildMarket("cavs", "Cleveland Cavaliers", 0.24),
          ]);
        case "nba-western-conference-champion-933":
          return buildEvent(slug, "Western Conference Champion", [
            buildMarket("okc-west", "Oklahoma City Thunder", 0.62),
            buildMarket("spurs-west", "San Antonio Spurs", 0.21),
          ]);
        default:
          throw new Error(`Unexpected slug ${slug}`);
      }
    });

    const payload = await getSportsLeagueDashboardPayload("nba");

    expect(payload).not.toBeNull();
    expect(payload?.sidebarFeatured.map((item) => item.label)).toEqual([
      "NBA",
      "UCL",
      "NHL",
      "UFC",
    ]);
    expect(payload?.heroCard.title).toBe("NBA Champion");
    expect(payload?.heroCard.outcomes.map((outcome) => outcome.label)).toEqual([
      "Oklahoma City Thunder",
      "San Antonio Spurs",
      "Boston Celtics",
    ]);
    expect(payload?.compactCards).toHaveLength(3);
    expect(payload?.barCards).toHaveLength(2);
  });
});
