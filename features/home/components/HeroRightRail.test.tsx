import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { HomeHeroModel } from "../selectors";
import { HeroRightRail } from "./HeroRightRail";

const hero: HomeHeroModel = {
  spotlight: null,
  spotlights: [],
  contextChips: [],
  breaking: [
    {
      event: {
        id: "event-1",
        ticker: "Event 1",
        slug: "event-1",
        title: "Speaker question context",
        active: true,
        closed: false,
        archived: false,
        featured: false,
        restricted: false,
        liquidity: 1_000,
        volume: 2_000,
        volume24hr: 500,
        negRisk: false,
        showAllOutcomes: false,
        showMarketImages: false,
        markets: [],
        tags: [],
      },
      market: {
        id: "market-1",
        question: "Will this happen?",
        conditionId: "condition-1",
        slug: "will-this-happen",
        line: null,
        outcomes: ["Yes", "No"],
        outcomePrices: [0.52, 0.48],
        clobTokenIds: ["token-1", "token-2"],
        volumeNum: 1_000,
        liquidityNum: 1_000,
        lastTradePrice: 0.52,
        bestBid: 0.51,
        bestAsk: 0.53,
        volume24hr: 400,
        oneDayPriceChange: 0.08,
        spread: 0.02,
        acceptingOrders: true,
        closed: false,
      },
      chance: 0.52,
      dayChange: 0.08,
      label: "December 31, 2026",
      href: "/event/event-1",
    },
  ],
  topics: [
    {
      slug: "basketball",
      label: "Basketball",
      totalVolume: 5_000_000,
      eventCount: 1,
      href: "/sports/live",
    },
    {
      slug: "world",
      label: "World",
      totalVolume: 501_000,
      eventCount: 15,
    },
  ],
};

describe("HeroRightRail", () => {
  it("formats topic support text with correct singular and plural labels", () => {
    render(<HeroRightRail hero={hero} />);

    expect(screen.getByRole("heading", { name: "Breaking news" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Hot topics" })).toBeTruthy();
    expect(screen.getByText("1 market")).toBeTruthy();
    expect(screen.getByText("15 markets")).toBeTruthy();

    const exploreLink = screen.getByRole("link", { name: "Explore all" });
    expect(exploreLink.getAttribute("href")).toBe("#all-markets");
  });
});
