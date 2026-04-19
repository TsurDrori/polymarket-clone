import { describe, expect, it } from "vitest";
import type { PolymarketEvent, PolymarketMarket, PolymarketTag } from "@/features/events/types";
import {
  extractLineValue,
  getSportsLeague,
  getSpreadOutcomeLabel,
  getTotalOutcomeLabel,
  isSportsFutureEvent,
  isSportsGameEvent,
  pickMoneylineMarket,
  pickSpreadMarket,
  pickTotalMarket,
} from "./parse";

const buildMarket = (
  overrides: Partial<PolymarketMarket> = {},
): PolymarketMarket => ({
  id: overrides.id ?? crypto.randomUUID(),
  question: overrides.question ?? "Match Winner",
  conditionId: overrides.conditionId ?? crypto.randomUUID(),
  slug: overrides.slug ?? "match-winner",
  groupItemTitle: overrides.groupItemTitle,
  image: overrides.image,
  icon: overrides.icon,
  endDate: overrides.endDate,
  outcomes: overrides.outcomes ?? ["Rockets", "Lakers"],
  outcomePrices: overrides.outcomePrices ?? [0.62, 0.38],
  clobTokenIds: overrides.clobTokenIds ?? ["a", "b"],
  volumeNum: overrides.volumeNum ?? 10_000,
  liquidityNum: overrides.liquidityNum ?? 5_000,
  lastTradePrice: overrides.lastTradePrice ?? 0.62,
  bestBid: overrides.bestBid ?? 0.61,
  bestAsk: overrides.bestAsk ?? 0.63,
  volume24hr: overrides.volume24hr ?? 1_000,
  oneDayPriceChange: overrides.oneDayPriceChange ?? 0.04,
  spread: overrides.spread ?? 0.02,
  acceptingOrders: overrides.acceptingOrders ?? true,
  closed: overrides.closed ?? false,
});

const buildEvent = (
  title: string,
  tags: PolymarketTag[],
  markets: PolymarketMarket[],
): PolymarketEvent => ({
  id: crypto.randomUUID(),
  ticker: "SPORT",
  slug: title.toLowerCase().replaceAll(/\s+/g, "-"),
  title,
  active: true,
  closed: false,
  archived: false,
  featured: false,
  restricted: false,
  liquidity: 100_000,
  volume: 200_000,
  volume24hr: 50_000,
  negRisk: false,
  showAllOutcomes: true,
  showMarketImages: false,
  markets,
  tags,
});

describe("sports parser", () => {
  it("separates live-style games from futures", () => {
    const liveEvent = buildEvent(
      "Rockets vs. Lakers",
      [
        { id: "1", slug: "sports", label: "Sports" },
        { id: "2", slug: "games", label: "Games" },
        { id: "3", slug: "nba", label: "NBA" },
      ],
      [buildMarket()],
    );
    const futureEvent = buildEvent(
      "2026 NBA Champion",
      [
        { id: "4", slug: "sports", label: "Sports" },
        { id: "5", slug: "nba", label: "NBA" },
      ],
      [buildMarket({ outcomes: ["Thunder", "Celtics"] })],
    );

    expect(isSportsGameEvent(liveEvent)).toBe(true);
    expect(isSportsFutureEvent(futureEvent)).toBe(true);
    expect(getSportsLeague(liveEvent)).toEqual({ slug: "nba", label: "NBA" });
  });

  it("finds moneyline, spread, and total markets from a game payload", () => {
    const moneyline = buildMarket({
      id: "moneyline",
      question: "Rockets vs. Lakers",
      outcomes: ["Rockets", "Lakers"],
    });
    const spread = buildMarket({
      id: "spread",
      question: "Spread: Rockets (-4.5)",
      groupItemTitle: "Spread -4.5",
      outcomes: ["Rockets", "Lakers"],
    });
    const total = buildMarket({
      id: "total",
      question: "O/U 208.5",
      groupItemTitle: "O/U 208.5",
      outcomes: ["Over", "Under"],
    });
    const event = buildEvent(
      "Rockets vs. Lakers",
      [
        { id: "1", slug: "sports", label: "Sports" },
        { id: "2", slug: "games", label: "Games" },
      ],
      [spread, total, moneyline],
    );

    expect(pickMoneylineMarket(event)?.id).toBe("moneyline");
    expect(pickSpreadMarket(event)?.id).toBe("spread");
    expect(pickTotalMarket(event)?.id).toBe("total");
    expect(extractLineValue(spread)).toBe(-4.5);
    expect(getSpreadOutcomeLabel(spread, 0)).toBe("Rockets -4.5");
    expect(getSpreadOutcomeLabel(spread, 1)).toBe("Lakers +4.5");
    expect(getTotalOutcomeLabel(total, 0)).toBe("O 208.5");
    expect(getTotalOutcomeLabel(total, 1)).toBe("U 208.5");
  });
});
