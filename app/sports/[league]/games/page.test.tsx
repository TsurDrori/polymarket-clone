import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SportsGameEvent } from "@/features/sports/games/parse";

const { getSportsGamesWorkingSet, notFound } = vi.hoisted(() => ({
  getSportsGamesWorkingSet: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound,
}));

vi.mock("@/features/sports/games/SportsRowsHydrator", () => ({
  SportsRowsHydrator: () => null,
}));

vi.mock("@/features/events/components/PriceCell", () => ({
  PriceCell: () => <span>48%</span>,
}));

vi.mock("@/features/sports/games/api", async () => {
  const actual = await vi.importActual<typeof import("@/features/sports/games/api")>(
    "@/features/sports/games/api",
  );

  return {
    ...actual,
    getSportsGamesWorkingSet,
  };
});

import SportsLeagueGamesPage from "./page";

const buildEvent = ({
  id,
  slug,
  title,
  leagueLabel,
}: {
  id: string;
  slug: string;
  title: string;
  leagueLabel: string;
}): SportsGameEvent => ({
  id,
  slug,
  title,
  startTime: "2026-04-19T17:00:00.000Z",
  endDate: "2026-04-19T19:30:00.000Z",
  volume: 200_000,
  volume24hr: 75_000,
  live: false,
  ended: false,
  period: "Q4",
  score: "101-98",
  eventWeek: 3,
  tags: [
    { id: "sports", slug: "sports", label: "Sports" },
    { id: "games", slug: "games", label: "Games" },
    {
      id: leagueLabel.toLowerCase(),
      slug: leagueLabel.toLowerCase(),
      label: leagueLabel,
    },
  ],
  teams: [
    {
      name: "Oklahoma City Thunder",
      abbreviation: "OKC",
      record: "52-20",
    },
    {
      name: "Denver Nuggets",
      abbreviation: "DEN",
      record: "49-23",
    },
  ],
  eventMetadata: {
    league: leagueLabel,
    tournament: "Playoffs",
  },
  markets: [
    {
      id: `${id}-moneyline`,
      question: `${title} moneyline`,
      groupItemTitle: undefined,
      sportsMarketType: "moneyline",
      line: null,
      outcomes: ["Oklahoma City Thunder", "Denver Nuggets"],
      outcomePrices: [0.54, 0.46],
      clobTokenIds: [`${id}-okc`, `${id}-den`],
      lastTradePrice: 0.54,
      bestBid: 0.53,
      bestAsk: 0.55,
      volumeNum: 50_000,
      volume24hr: 20_000,
      acceptingOrders: true,
      closed: false,
    },
    {
      id: `${id}-spread`,
      question: `${title} spread`,
      groupItemTitle: undefined,
      sportsMarketType: "spreads",
      line: -4.5,
      outcomes: ["Oklahoma City Thunder", "Denver Nuggets"],
      outcomePrices: [0.51, 0.49],
      clobTokenIds: [`${id}-spread-okc`, `${id}-spread-den`],
      lastTradePrice: 0.51,
      bestBid: 0.5,
      bestAsk: 0.52,
      volumeNum: 35_000,
      volume24hr: 12_500,
      acceptingOrders: true,
      closed: false,
    },
    {
      id: `${id}-total`,
      question: `${title} total`,
      groupItemTitle: undefined,
      sportsMarketType: "totals",
      line: 224.5,
      outcomes: ["Over", "Under"],
      outcomePrices: [0.48, 0.52],
      clobTokenIds: [`${id}-over`, `${id}-under`],
      lastTradePrice: 0.48,
      bestBid: 0.47,
      bestAsk: 0.49,
      volumeNum: 25_000,
      volume24hr: 10_000,
      acceptingOrders: true,
      closed: false,
    },
  ],
});

describe("SportsLeagueGamesPage", () => {
  it("renders the requested league games route with the games/props switch", async () => {
    getSportsGamesWorkingSet.mockResolvedValueOnce([
      buildEvent({
        id: "nba",
        slug: "thunder-vs-nuggets",
        title: "Thunder vs. Nuggets",
        leagueLabel: "NBA",
      }),
      buildEvent({
        id: "nhl",
        slug: "bruins-vs-rangers",
        title: "Bruins vs. Rangers",
        leagueLabel: "NHL",
      }),
    ]);

    const ui = await SportsLeagueGamesPage({
      params: Promise.resolve({ league: "nba" }),
    });

    render(ui);

    expect(screen.getByRole("heading", { name: "NBA" })).toBeTruthy();
    expect(screen.getByText("Oklahoma City Thunder")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Games" }).getAttribute("href"),
    ).toBe("/sports/nba/games");
    expect(
      screen.getByRole("link", { name: "Props" }).getAttribute("href"),
    ).toBe("/sports/nba/props");
    expect(screen.queryByRole("heading", { name: "NHL" })).toBeNull();
  });

  it("maps an empty league games working set to notFound()", async () => {
    getSportsGamesWorkingSet.mockResolvedValueOnce([]);

    await expect(
      SportsLeagueGamesPage({
        params: Promise.resolve({ league: "wnba" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
