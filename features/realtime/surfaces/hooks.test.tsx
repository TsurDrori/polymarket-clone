import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useProjectedSurfaceWindow } from "./hooks";
import type { SurfaceProjectionPolicy } from "./types";

type TestItem = {
  id: string;
  score: number;
};

const TEST_POLICY: SurfaceProjectionPolicy = {
  initialVisibleCount: 2,
  visibleIncrement: 1,
  overscanCount: 2,
  maxPromotionsPerCycle: 1,
  reorderCooldownMs: 0,
  highlightMs: 1_000,
};

const renderProjectedSurfaceWindow = (items: ReadonlyArray<TestItem>) =>
  renderHook(({ currentItems, currentReducedMotion = false }) =>
    useProjectedSurfaceWindow({
      items: currentItems,
      getItemId: (item) => item.id,
      getItemTokenIds: () => [],
      getItemLiveScore: (item) => item.score,
      policy: TEST_POLICY,
      reducedMotion: currentReducedMotion,
    }), {
    initialProps: {
      currentItems: items,
      currentReducedMotion: false,
    },
  });

describe("useProjectedSurfaceWindow", () => {
  it("promotes the hottest items without losing the current window", async () => {
    const { result, rerender } = renderProjectedSurfaceWindow([
      { id: "a", score: 1 },
      { id: "b", score: 2 },
      { id: "c", score: 3 },
    ]);

    await waitFor(() => {
      expect(result.current.visibleIds).toEqual(["c", "b"]);
    });

    rerender({
      currentItems: [
        { id: "a", score: 10 },
        { id: "b", score: 2 },
        { id: "c", score: 1 },
      ],
      currentReducedMotion: false,
    });

    await waitFor(() => {
      expect(result.current.visibleIds).toEqual(["a", "b"]);
    });

    expect(result.current.highlightedIds).toEqual(["a"]);
  });

  it("resets expanded visibility when the backing item ids change", async () => {
    const { result, rerender } = renderProjectedSurfaceWindow([
      { id: "a", score: 1 },
      { id: "b", score: 2 },
      { id: "c", score: 3 },
    ]);

    await waitFor(() => {
      expect(result.current.visibleIds).toEqual(["c", "b"]);
    });

    act(() => {
      result.current.showMore();
    });

    await waitFor(() => {
      expect(result.current.visibleIds).toEqual(["c", "b", "a"]);
    });

    rerender({
      currentItems: [
        { id: "d", score: 4 },
        { id: "e", score: 3 },
        { id: "f", score: 2 },
      ],
      currentReducedMotion: false,
    });

    expect(result.current.visibleIds).toEqual(["d", "e"]);
    expect(result.current.highlightedIds).toEqual([]);
    expect(result.current.hasMore).toBe(true);
  });

  it("preserves expanded visibility when the backing item ids are appended", async () => {
    const { result, rerender } = renderHook(
      ({ currentItems, currentReducedMotion = true }) =>
        useProjectedSurfaceWindow({
          items: currentItems,
          getItemId: (item) => item.id,
          getItemTokenIds: () => [],
          getItemLiveScore: (item) => item.score,
          policy: TEST_POLICY,
          reducedMotion: currentReducedMotion,
        }),
      {
        initialProps: {
          currentItems: [
            { id: "a", score: 1 },
            { id: "b", score: 2 },
            { id: "c", score: 3 },
          ],
          currentReducedMotion: true,
        },
      },
    );

    await waitFor(() => {
      expect(result.current.visibleIds).toEqual(["a", "b"]);
    });

    act(() => {
      result.current.showMore();
    });

    await waitFor(() => {
      expect(result.current.visibleIds).toEqual(["a", "b", "c"]);
    });

    rerender({
      currentItems: [
        { id: "a", score: 1 },
        { id: "b", score: 2 },
        { id: "c", score: 3 },
        { id: "d", score: 4 },
        { id: "e", score: 5 },
      ],
      currentReducedMotion: true,
    });

    expect(result.current.visibleIds).toEqual(["a", "b", "c"]);
    expect(result.current.hasMore).toBe(true);
  });

  it("keeps the base order and suppresses highlight churn in reduced motion mode", async () => {
    const { result, rerender } = renderProjectedSurfaceWindow([
      { id: "a", score: 1 },
      { id: "b", score: 2 },
      { id: "c", score: 9 },
    ]);

    await waitFor(() => {
      expect(result.current.visibleIds).toEqual(["c", "b"]);
    });

    rerender({
      currentItems: [
        { id: "a", score: 1 },
        { id: "b", score: 2 },
        { id: "c", score: 9 },
      ],
      currentReducedMotion: true,
    });

    await waitFor(() => {
      expect(result.current.visibleIds).toEqual(["a", "b"]);
    });

    expect(result.current.highlightedIds).toEqual([]);
  });
});
