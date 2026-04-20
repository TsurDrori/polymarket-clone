import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { getSportsCardWorkingSet } = vi.hoisted(() => ({
  getSportsCardWorkingSet: vi.fn(),
}));

vi.mock("@/features/sports/futures/api", () => ({
  getSportsCardWorkingSet,
}));

import SportsFuturesPage from "./page";

describe("SportsFuturesPage", () => {
  it("renders the live empty-state shell without fetching the futures working set", () => {
    render(<SportsFuturesPage />);

    expect(screen.getByRole("heading", { name: "Futures" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "No results found" })).toBeTruthy();
    expect(getSportsCardWorkingSet).not.toHaveBeenCalled();
  });
});
