import { act, cleanup, render, screen } from "@testing-library/react";
import { Provider } from "jotai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flashAtomFamily, priceAtomFamily, type Tick } from "@/features/realtime/atoms";
import { __resetRealtimeStoreForTests, getRealtimeStore } from "@/features/realtime/store";
import { LivePriceDelta } from "./LivePriceDelta";

vi.mock("@/features/realtime/subscriptions", () => ({
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
}));

const buildTick = (overrides: Partial<Tick> = {}): Tick => ({
  price: overrides.price ?? 0.52,
  bestBid: overrides.bestBid ?? 0.51,
  bestAsk: overrides.bestAsk ?? 0.53,
  ts: overrides.ts ?? 1,
  prevPrice: overrides.prevPrice ?? 0.52,
  changedAt: overrides.changedAt ?? 0,
  changeMagnitude: overrides.changeMagnitude ?? 0,
});

describe("LivePriceDelta", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    __resetRealtimeStoreForTests();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("stays empty for the hydrated snapshot until a live websocket change arrives", () => {
    const store = getRealtimeStore();
    store.set(priceAtomFamily("token-a"), buildTick());

    render(
      <Provider store={store}>
        <LivePriceDelta tokenId="token-a" />
      </Provider>,
    );

    expect(screen.queryByText("+4%")).toBeNull();
    expect(screen.queryByText("-4%")).toBeNull();
  });

  it("shows the signed live delta from the previous websocket price and settles after the swap", () => {
    const store = getRealtimeStore();
    store.set(priceAtomFamily("token-a"), buildTick());

    render(
      <Provider store={store}>
        <LivePriceDelta tokenId="token-a" />
      </Provider>,
    );

    act(() => {
      store.set(
        priceAtomFamily("token-a"),
        buildTick({
          price: 0.56,
          prevPrice: 0.52,
          ts: 2,
          changedAt: 2,
          changeMagnitude: 0.04,
        }),
      );
      store.set(flashAtomFamily("token-a"), {
        seq: 1,
        dir: "up",
      });
    });

    expect(screen.getAllByText("+4%")).toHaveLength(2);

    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    expect(screen.getByText("+4%")).toBeTruthy();
  });
});
