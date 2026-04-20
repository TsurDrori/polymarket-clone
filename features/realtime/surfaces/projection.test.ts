import { describe, expect, it } from "vitest";
import {
  buildProjectedSurfaceWindow,
  clampVisibleCount,
  commitProjectedVisibleIds,
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

  it("respects the reorder cooldown before committing a promotion", () => {
    expect(
      commitProjectedVisibleIds({
        previousVisibleIds: ["a", "b"],
        projectedVisibleIds: ["c", "a"],
        orderedIds: ["c", "a", "b"],
        maxPromotionsPerCycle: 1,
        now: 500,
        lastReorderAt: 100,
        reorderCooldownMs: 1_000,
      }),
    ).toEqual({
      visibleIds: ["a", "b"],
      highlightedIds: [],
      didChange: false,
      lastReorderAt: 100,
    });

    expect(
      commitProjectedVisibleIds({
        previousVisibleIds: ["a", "b"],
        projectedVisibleIds: ["c", "a"],
        orderedIds: ["c", "a", "b"],
        maxPromotionsPerCycle: 1,
        now: 1_500,
        lastReorderAt: 100,
        reorderCooldownMs: 1_000,
      }),
    ).toEqual({
      visibleIds: ["c", "a"],
      highlightedIds: ["c", "a"],
      didChange: true,
      lastReorderAt: 1_500,
    });
  });

  it("keeps the base ordering when reduced motion is enabled", () => {
    const projected = buildProjectedSurfaceWindow(
      [
        { id: "a", baseIndex: 0, liveScore: 1 },
        { id: "b", baseIndex: 1, liveScore: 2 },
        { id: "c", baseIndex: 2, liveScore: 9 },
      ],
      {
        visibleCount: 2,
        overscanCount: 2,
        reducedMotion: true,
      },
    );

    expect(projected.candidateIds).toEqual(["a", "b", "c"]);
    expect(projected.visibleIds).toEqual(["a", "b"]);
    expect(projected.orderedIds).toEqual(["a", "b", "c"]);
  });
});
