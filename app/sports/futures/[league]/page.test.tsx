import { render, screen } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import type {
  PolymarketEvent,
  PolymarketMarket,
  PolymarketTag,
} from "@/features/events/types";

const { getSportsCardWorkingSet, notFound } = vi.hoisted(() => ({
  getSportsCardWorkingSet: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound,
}));

vi.mock("next/image", () => ({
  default: ({
    fill: _fill,
    ...props
  }: ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    (void _fill, <img alt="" {...props} />)
  ),
}));

vi.mock("@/features/realtime/Hydrator", () => ({
  Hydrator: () => null,
}));

vi.mock("@/features/events/components/PriceCell", () => ({
  PriceCell: () => <span>48%</span>,
}));

vi.mock("@/features/sports/futures/api", async () => {
  const actual = await vi.importActual<typeof import("@/features/sports/futures/api")>(
    "@/features/sports/futures/api",
  );

  return {
    ...actual,
    getSportsCardWorkingSet,
  };
});

import SportsLeagueFuturesPage from "./page";

const buildMarket = (
  id: string,
  overrides: Partial<PolymarketMarket> = {},
): PolymarketMarket => ({
  id,
  question: `Question ${id}`,
  conditionId: `condition-${id}`,
  slug: `market-${id}`,
  groupItemTitle: `Outcome ${id}`,
  outcomes: ["Yes", "No"],
  outcomePrices: [0.48, 0.52],
  clobTokenIds: [`${id}-yes`, `${id}-no`],
  volumeNum: 50_000,
  liquidityNum: 10_000,
  lastTradePrice: 0.48,
  bestBid: 0.47,
  bestAsk: 0.48,
  volume24hr: 5_000,
  oneDayPriceChange: 0.02,
  spread: 0.01,
  acceptingOrders: true,
  closed: false,
  ...overrides,
});

const buildEvent = ({
  id,
  slug,
  title,
  tags,
}: {
  id: string;
  slug: string;
  title: string;
  tags: PolymarketTag[];
}): PolymarketEvent => ({
  id,
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
  markets: [
    buildMarket(`${id}-1`, {
      groupItemTitle: "Oklahoma City Thunder",
      lastTradePrice: 0.48,
      outcomePrices: [0.48, 0.52],
    }),
    buildMarket(`${id}-2`, {
      groupItemTitle: "San Antonio Spurs",
      lastTradePrice: 0.15,
      outcomePrices: [0.15, 0.85],
    }),
  ],
  tags,
});

describe("SportsLeagueFuturesPage", () => {
  it("renders the requested league's futures cards", async () => {
    getSportsCardWorkingSet.mockResolvedValueOnce([
      buildEvent({
        id: "nba",
        slug: "2026-nba-champion",
        title: "2026 NBA Champion",
        tags: [
          { id: "1", slug: "sports", label: "Sports" },
          { id: "2", slug: "nba", label: "NBA" },
        ],
      }),
      buildEvent({
        id: "nhl",
        slug: "2026-nhl-champion",
        title: "2026 NHL Champion",
        tags: [
          { id: "3", slug: "sports", label: "Sports" },
          { id: "4", slug: "nhl", label: "NHL" },
        ],
      }),
    ]);

    const ui = await SportsLeagueFuturesPage({
      params: Promise.resolve({ league: "nba" }),
    } as PageProps<"/sports/futures/[league]">);

    render(ui);

    expect(screen.getByRole("heading", { name: "NBA" })).toBeTruthy();
    expect(screen.getByText("2026 NBA Champion")).toBeTruthy();
    expect(screen.queryByText("2026 NHL Champion")).toBeNull();
  });

  it("maps an empty league working set to notFound()", async () => {
    getSportsCardWorkingSet.mockResolvedValueOnce([]);

    await expect(
      SportsLeagueFuturesPage({
        params: Promise.resolve({ league: "wnba" }),
      } as PageProps<"/sports/futures/[league]">),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
