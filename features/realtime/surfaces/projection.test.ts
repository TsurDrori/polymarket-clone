import { describe, expect, it } from "vitest";
import {
  buildProjectedSurfaceWindow,
  clampVisibleCount,
  expandVisibleCount,
  limitVisiblePromotions,
} from "./projection";

describe("surface projection helpers", () => {
  it("reorders only inside the bounded visible window plus overscan", () => {
    const projected = buildProjectedSurfaceWindow(
      [
        { id: "a", baseIndex: 0, liveScore: 1 },
        { id: "b", baseIndex: 1, liveScore: 2 },
        { id: "c", baseIndex: 2, liveScore: 9 },
        { id: "d", baseIndex: 3, liveScore: 10 },
      ],
      {
        visibleCount: 2,
        overscanCount: 1,
      },
    );

    expect(projected.visibleIds).toEqual(["c", "b"]);
    expect(projected.orderedIds).toEqual(["c", "b", "a", "d"]);
  });

  it("clamps and expands visible counts safely", () => {
    expect(clampVisibleCount(10, 4)).toBe(4);
    expect(clampVisibleCount(10, 40)).toBe(10);
    expect(expandVisibleCount(18, 30, 12)).toBe(30);
    expect(expandVisibleCount(18, 30, 6)).toBe(24);
  });

  it("limits visible promotions to the configured budget", () => {
    expect(
      limitVisiblePromotions({
        previousVisibleIds: ["a", "b", "c"],
        projectedVisibleIds: ["d", "e", "c"],
        maxPromotionsPerCycle: 1,
      }),
    ).toEqual(["d", "c", "a"]);
  });
});
