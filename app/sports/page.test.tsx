import { describe, expect, it, vi } from "vitest";

const { permanentRedirect } = vi.hoisted(() => ({
  permanentRedirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("next/navigation", () => ({
  permanentRedirect,
}));

import SportsPage from "./page";

describe("SportsPage", () => {
  it("redirects /sports to /sports/live", async () => {
    expect(() => SportsPage()).toThrow("NEXT_REDIRECT");
    expect(permanentRedirect).toHaveBeenCalledWith("/sports/live");
  });
});
