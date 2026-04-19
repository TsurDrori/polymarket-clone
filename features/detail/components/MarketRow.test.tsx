import { act, render, screen } from "@testing-library/react";
import { Provider } from "jotai";
import { afterEach, describe, expect, it, vi } from "vitest";
import fixture from "@/fixtures/gamma-event-sample.json";
import { parseEvent } from "@/features/events/api/parse";
import { priceAtomFamily } from "@/features/realtime/atoms";
import { Hydrator } from "@/features/realtime/Hydrator";
import { __resetRealtimeStoreForTests, getRealtimeStore } from "@/features/realtime/store";
import { MarketRow } from "./MarketRow";

vi.mock("@/features/realtime/subscriptions", () => ({
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
}));

const event = parseEvent(fixture.events[0]);
const market = event.markets[0];

describe("MarketRow", () => {
  afterEach(() => {
    __resetRealtimeStoreForTests();
  });

  it("keeps the probability text and bar aligned for the same live yes token", () => {
    const store = getRealtimeStore();
    const yesTokenId = market.clobTokenIds[0];

    render(
      <Provider store={store}>
        <Hydrator events={[event]} />
        <MarketRow market={market} />
      </Provider>,
    );

    expect(screen.getByText("17%")).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(
      String(market.lastTradePrice),
    );

    act(() => {
      const prevTick = store.get(priceAtomFamily(yesTokenId));

      store.set(priceAtomFamily(yesTokenId), {
        ...prevTick,
        price: 0.61,
        ts: prevTick.ts + 1,
      });
    });

    expect(screen.getByText("61%")).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("0.61");
  });
});
