import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SportsLeagueChip } from "@/features/sports/games/parse";
import { SportsLeagueRail } from "./SportsLeagueRail";

const chips: SportsLeagueChip[] = [
  { slug: "nba", label: "NBA", count: 24, href: "/sports/live/nba" },
  { slug: "ucl", label: "UCL", count: 10, href: "/sports/live/ucl" },
  { slug: "nhl", label: "NHL", count: 13, href: "/sports/live/nhl" },
  { slug: "ufc", label: "UFC", count: 40, href: "/sports/live/ufc" },
  { slug: "nfl", label: "NFL", count: 1, href: "/sports/live/nfl" },
  { slug: "nfl-draft", label: "NFL Draft", count: 1, href: "/sports/live/nfl-draft" },
  { slug: "cfb", label: "CFB", count: 1, href: "/sports/live/cfb" },
  { slug: "epl", label: "EPL", count: 84, href: "/sports/live/epl" },
];

describe("SportsLeagueRail", () => {
  it("renders featured leaf links plus mixed dropdown groups", () => {
    render(<SportsLeagueRail chips={chips} />);

    const [, desktopRail] = screen.getAllByRole("navigation", { name: /sports leagues/i });

    expect(within(desktopRail).getByRole("link", { name: /All Sports/i })).toBeTruthy();
    expect(within(desktopRail).getByRole("link", { name: /NBA/i })).toBeTruthy();
    expect(within(desktopRail).getByRole("button", { name: /Football/i })).toBeTruthy();
    expect(within(desktopRail).queryByRole("button", { name: /^NBA$/i })).toBeNull();
  });

  it("opens football by default on the landing route and allows other groups to expand", () => {
    render(<SportsLeagueRail chips={chips} />);

    const [, desktopRail] = screen.getAllByRole("navigation", { name: /sports leagues/i });
    const footballButton = within(desktopRail).getByRole("button", { name: /Football/i });
    const soccerButton = within(desktopRail).getByRole("button", { name: /Soccer/i });
    const footballPanel = document.getElementById(footballButton.getAttribute("aria-controls") ?? "");
    const soccerPanel = document.getElementById(soccerButton.getAttribute("aria-controls") ?? "");

    expect(footballButton.getAttribute("aria-expanded")).toBe("true");
    expect(footballPanel?.hasAttribute("hidden")).toBe(false);
    expect(
      within(desktopRail)
        .getAllByRole("link")
        .some((link) => link.getAttribute("href") === "/sports/live/nfl"),
    ).toBe(true);

    expect(soccerButton.getAttribute("aria-expanded")).toBe("false");
    expect(soccerPanel?.hasAttribute("hidden")).toBe(true);
    fireEvent.click(soccerButton);
    expect(soccerButton.getAttribute("aria-expanded")).toBe("true");
    expect(soccerPanel?.hasAttribute("hidden")).toBe(false);
    expect(
      within(desktopRail)
        .getAllByRole("link")
        .some((link) => link.getAttribute("href") === "/sports/live/epl"),
    ).toBe(true);

    fireEvent.click(soccerButton);
    expect(soccerButton.getAttribute("aria-expanded")).toBe("false");
    expect(soccerPanel?.hasAttribute("hidden")).toBe(true);
  });
});
