import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { getSportsFuturesIndexPagePayload } = vi.hoisted(() => ({
  getSportsFuturesIndexPagePayload: vi.fn(),
}));

vi.mock("@/features/realtime/Hydrator", () => ({
  Hydrator: () => null,
}));

vi.mock("@/features/events/components/PriceCell", () => ({
  PriceCell: () => <span>49%</span>,
}));

vi.mock("@/features/sports/server", () => ({
  getSportsFuturesIndexPagePayload,
}));

import SportsFuturesPage from "./page";

describe("SportsFuturesPage", () => {
  it("renders the graph-first futures landing dashboard", async () => {
    getSportsFuturesIndexPagePayload.mockResolvedValueOnce({
      dashboard: {
        league: "nba",
        title: "Sports Futures",
        sidebarFeatured: [
          {
            slug: "nba",
            label: "NBA",
            countLabel: "22",
            href: "/sports/futures/nba",
            active: true,
          },
        ],
        sidebarSections: [],
        pills: [
          { slug: "nba", label: "NBA", href: "/sports/futures/nba", active: true },
          { slug: "epl", label: "EPL", href: "/sports/futures/epl" },
        ],
        heroCard: {
          id: "hero",
          slug: "2026-nba-champion",
          title: "NBA Champion",
          role: "hero",
          imageSrc: null,
          outcomes: [
            {
              id: "okc",
              label: "Oklahoma City Thunder",
              shortLabel: "OKC",
              probability: 0.49,
              probabilityLabel: "49%",
              tokenId: "okc-token",
              accentColor: "#1f9ef6",
            },
          ],
          hiddenOutcomeCount: 2,
          href: "/event/2026-nba-champion",
          event: {
            id: "hero",
            ticker: "NBA",
            slug: "2026-nba-champion",
            title: "2026 NBA Champion",
            active: true,
            closed: false,
            archived: false,
            featured: false,
            restricted: false,
            liquidity: 1000,
            volume: 1000,
            volume24hr: 1000,
            negRisk: false,
            showAllOutcomes: true,
            showMarketImages: false,
            tags: [],
            markets: [],
          },
        },
        compactCards: [],
        barCards: [],
        hydrationEvents: [],
      },
    });

    render(await SportsFuturesPage());

    expect(screen.getByRole("heading", { name: "Sports Futures" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "NBA Champion" })).toBeTruthy();
    expect(screen.getByText("Oklahoma City Thunder")).toBeTruthy();
    expect(screen.getByRole("link", { name: /^NBA22$/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Popular NBA markets" })).toBeTruthy();
  });
});
