import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HeroSpotlightModel, HomeHeroModel } from "../selectors";
import { HomeHero } from "./HomeHero";

const setMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

const buildSpotlight = (
  title: string,
  navigationLabel: string,
): HeroSpotlightModel => ({
  event: {
    id: `${navigationLabel}-event`,
    ticker: title,
    slug: navigationLabel,
    title,
    active: true,
    closed: false,
    archived: false,
    featured: false,
    restricted: false,
    liquidity: 1_000_000,
    volume: 2_000_000,
    volume24hr: 500_000,
    negRisk: false,
    showAllOutcomes: false,
    showMarketImages: false,
    markets: [],
    tags: [],
  },
  market: {
    id: `${navigationLabel}-market`,
    question: title,
    conditionId: `${navigationLabel}-condition`,
    slug: navigationLabel,
    line: null,
    outcomes: ["Yes", "No"],
    outcomePrices: [0.64, 0.36],
    clobTokenIds: ["yes-token", "no-token"],
    volumeNum: 12_000,
    liquidityNum: 6_000,
    lastTradePrice: 0.64,
    bestBid: 0.63,
    bestAsk: 0.65,
    volume24hr: 2_500,
    oneDayPriceChange: 0.08,
    spread: 0.02,
    acceptingOrders: true,
    closed: false,
  },
  tokenId: "yes-token",
  chart: null,
  headline: title,
  summary: `${title} summary`,
  categoryLabel: "Politics",
  chance: 0.64,
  dayChange: 0.08,
  volumeLabel: "$2M",
  notes: ["Up 8 pts over 24h."],
  sourceRows: [
    {
      label: "Reuters",
      value: `${title} source line`,
    },
  ],
  sourceMode: "fallback-derived",
  outcomeMode: "binary",
  outcomeItems: [
    { marketId: `${navigationLabel}-0`, label: "Yes", chance: 0.64, href: `/event/${navigationLabel}` },
    { marketId: `${navigationLabel}-1`, label: "No", chance: 0.36, href: `/event/${navigationLabel}` },
  ],
  href: `/event/${navigationLabel}`,
  navigationLabel,
});

describe("HomeHero", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setMatchMedia(false);
    Object.defineProperty(document, "hasFocus", {
      configurable: true,
      value: () => true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rotates every 10 seconds and preserves the remaining delay after hover pauses", () => {
    const hero: HomeHeroModel = {
      spotlight: buildSpotlight("First spotlight question?", "First"),
      spotlights: [
        buildSpotlight("First spotlight question?", "First"),
        buildSpotlight("Second spotlight question?", "Second"),
      ],
      pulse: [],
      topics: [],
      contextChips: [],
    };

    render(<HomeHero hero={hero} />);

    expect(screen.getByRole("heading", { name: "First spotlight question?" })).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(9_000);
    });

    const spotlightColumn = document.querySelector("[data-spotlight-column]");
    expect(spotlightColumn).toBeTruthy();

    fireEvent.mouseEnter(spotlightColumn!);

    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    expect(screen.queryByRole("heading", { name: "Second spotlight question?" })).toBeNull();

    fireEvent.mouseLeave(spotlightColumn!);

    act(() => {
      vi.advanceTimersByTime(999);
    });

    expect(screen.queryByRole("heading", { name: "Second spotlight question?" })).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(screen.getByRole("heading", { name: "Second spotlight question?" })).toBeTruthy();
  });
});
