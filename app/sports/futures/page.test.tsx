import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { getSportsFuturesIndexPagePayload } = vi.hoisted(() => ({
  getSportsFuturesIndexPagePayload: vi.fn(),
}));

vi.mock("@/features/sports/server", () => ({
  getSportsFuturesIndexPagePayload,
}));

import SportsFuturesPage from "./page";

describe("SportsFuturesPage", () => {
  it("renders the live empty-state discovery route with a populated rail", async () => {
    getSportsFuturesIndexPagePayload.mockResolvedValueOnce({
      allCountLabel: "9.2K",
      railItems: [
        { slug: "nba", label: "NBA", count: 63, href: "/sports/futures/nba" },
        { slug: "nhl", label: "NHL", count: 54, href: "/sports/futures/nhl" },
      ],
    });

    render(await SportsFuturesPage());

    expect(screen.getByRole("heading", { name: "futures" })).toBeTruthy();
    expect(screen.getByText("No results found")).toBeTruthy();
    expect(screen.getByRole("link", { name: /All/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /NBA/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Frequently Asked Questions" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Popular futures markets" })).toBeTruthy();
  });
});
