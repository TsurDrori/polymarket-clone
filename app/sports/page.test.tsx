import { describe, expect, it, vi } from "vitest";

const { redirect } = vi.hoisted(() => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("next/navigation", () => ({
  redirect,
}));

import SportsPage from "./page";

describe("SportsPage", () => {
  it("redirects /sports to /sports/live", async () => {
    expect(() => SportsPage()).toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/sports/live");
  });
});
