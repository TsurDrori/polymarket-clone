import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { HeroSpotlightModel } from "../selectors";
import { HeroSpotlightCard } from "./HeroSpotlightCard";

const spotlight: HeroSpotlightModel = {
  event: {
    id: "event-1",
    ticker: "2026 Championship",
    slug: "2026-championship",
    title: "2026 Championship",
    active: true,
    closed: false,
    archived: false,
    featured: true,
    restricted: false,
    liquidity: 1_000_000,
    volume: 2_000_000,
    volume24hr: 900_000,
    negRisk: false,
    showAllOutcomes: false,
    showMarketImages: false,
    markets: [],
    tags: [],
  },
  market: {
    id: "market-1",
    question: "Who will win the 2026 Championship?",
    conditionId: "condition-1",
    slug: "who-will-win-the-2026-championship",
    groupItemTitle: "Team A",
    line: null,
    outcomes: ["Yes", "No"],
    outcomePrices: [0.49, 0.51],
    clobTokenIds: ["token-1", "token-2"],
    volumeNum: 12_000,
    liquidityNum: 6_000,
    lastTradePrice: 0.49,
    bestBid: 0.48,
    bestAsk: 0.5,
    volume24hr: 2_500,
    oneDayPriceChange: 0.08,
    spread: 0.02,
    acceptingOrders: true,
    closed: false,
  },
  tokenId: "token-1",
  chart: null,
  headline: "Who will win the 2026 Championship?",
  summary: "Championship summary",
  categoryLabel: "Sports",
  subcategoryLabel: "Basketball",
  chance: 0.49,
  dayChange: 0.08,
  volumeLabel: "$9M",
  notes: ["Up 8 pts over 24h."],
  sourceRows: [
    {
      label: "Reuters",
      value: "Championship source row",
    },
  ],
  sourceMode: "fallback-derived",
  outcomeMode: "multi-market",
  outcomeItems: [
    { marketId: "team-a", label: "Team A", chance: 0.49, href: "/event/2026-championship" },
    { marketId: "team-b", label: "Team B", chance: 0.15, href: "/event/2026-championship" },
    { marketId: "team-c", label: "Team C", chance: 0.13, href: "/event/2026-championship" },
    { marketId: "team-d", label: "Team D", chance: 0.09, href: "/event/2026-championship" },
  ],
  href: "/event/2026-championship",
  navigationLabel: "Championship",
};

describe("HeroSpotlightCard", () => {
  it("renders multi-market outcome rows for grouped events", () => {
    render(<HeroSpotlightCard spotlight={spotlight} />);

    expect(screen.getByText("Team A")).toBeTruthy();
    expect(screen.getByText("Team B")).toBeTruthy();
    expect(screen.getByText("Team C")).toBeTruthy();
    expect(screen.getByText("Team D")).toBeTruthy();
    expect(screen.getByText("15%")).toBeTruthy();
    expect(screen.queryByText(/^Yes$/)).toBeNull();
    expect(screen.queryByText(/^No$/)).toBeNull();
  });
});
