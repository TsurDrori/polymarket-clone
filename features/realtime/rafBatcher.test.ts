import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flashAtomFamily, priceAtomFamily } from "./atoms";
import { __resetRafBatcherForTests, enqueue } from "./rafBatcher";
import { __resetRealtimeStoreForTests, getRealtimeStore } from "./store";

describe("rafBatcher", () => {
  beforeEach(() => {
    vi.useFakeTimers();

    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) =>
        window.setTimeout(() => callback(Date.now()), 16),
      ),
    );
    vi.stubGlobal("cancelAnimationFrame", (id: number) => window.clearTimeout(id));
  });

  afterEach(() => {
    __resetRafBatcherForTests();
    __resetRealtimeStoreForTests();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("schedules only one frame when enqueue is called twice in the same tick", () => {
    enqueue("token-a", { price: 0.61, ts: 10 });
    enqueue("token-b", { price: 0.39, ts: 11 });

    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
  });

  it("uses the last write for each token within the same frame", () => {
    const store = getRealtimeStore();

    enqueue("token-a", { price: 0.61, ts: 10 });
    enqueue("token-a", { price: 0.63, ts: 11 });

    vi.advanceTimersByTime(16);

    expect(store.get(priceAtomFamily("token-a"))).toEqual({
      price: 0.63,
      bestBid: 0,
      bestAsk: 0,
      ts: 11,
    });
  });

  it("merges partial websocket ticks with the seeded REST snapshot", () => {
    const store = getRealtimeStore();

    store.set(priceAtomFamily("token-a"), {
      price: 0.4,
      bestBid: 0.39,
      bestAsk: 0.41,
      ts: 1,
    });

    enqueue("token-a", { price: 0.44, ts: 2 });

    vi.advanceTimersByTime(16);

    expect(store.get(priceAtomFamily("token-a"))).toEqual({
      price: 0.44,
      bestBid: 0.39,
      bestAsk: 0.41,
      ts: 2,
    });
  });

  it("does not bump flash state when the price is unchanged", () => {
    const store = getRealtimeStore();

    store.set(priceAtomFamily("token-a"), {
      price: 0.5,
      bestBid: 0.49,
      bestAsk: 0.51,
      ts: 1,
    });
    store.set(flashAtomFamily("token-a"), {
      seq: 2,
      dir: "up",
    });

    enqueue("token-a", { price: 0.5, bestBid: 0.5, bestAsk: 0.52, ts: 2 });

    vi.advanceTimersByTime(16);

    expect(store.get(flashAtomFamily("token-a"))).toEqual({
      seq: 2,
      dir: "up",
    });
    expect(store.get(priceAtomFamily("token-a"))).toEqual({
      price: 0.5,
      bestBid: 0.5,
      bestAsk: 0.52,
      ts: 2,
    });
  });
});
