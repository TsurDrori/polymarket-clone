import { render, screen } from "@testing-library/react";
import { Provider } from "jotai";
import { describe, expect, it, vi } from "vitest";
import fixture from "@/fixtures/gamma-event-sample.json";
import { parseEvent } from "@/features/events/api/parse";
import type { PolymarketMarket } from "@/features/events/types";
import { Hydrator } from "@/features/realtime/Hydrator";
import { MarketList } from "./MarketList";

vi.mock("@/features/realtime/subscriptions", () => ({
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
}));

const event = parseEvent(fixture.events[0]);
const baseMarket = event.markets[0];

const makeMarket = (
  overrides: Partial<PolymarketMarket> & Pick<PolymarketMarket, "id">,
): PolymarketMarket => ({
  ...baseMarket,
  ...overrides,
});

const renderMarketList = (markets: PolymarketMarket[]) =>
  render(
    <Provider>
      <Hydrator events={[{ ...event, markets }]} />
      <MarketList markets={markets} />
    </Provider>,
  );

describe("MarketList", () => {
  it("falls back from groupItemTitle to question when the row title is empty", () => {
    const markets = [
      makeMarket({
        id: "moneyline",
        groupItemTitle: "",
        question: "Rockets vs. Lakers",
        outcomes: ["Rockets", "Lakers"],
        outcomePrices: [0.52, 0.48],
        clobTokenIds: ["moneyline-rockets", "moneyline-lakers"],
      }),
    ];

    renderMarketList(markets);

    expect(screen.getByRole("heading", { name: "Rockets vs. Lakers" })).toBeTruthy();
  });

  it("renders payload outcome labels for sports rows instead of hardcoded Yes and No", () => {
    const markets = [
      makeMarket({
        id: "spread",
        groupItemTitle: "Spread -4.5",
        question: "Spread: Rockets (-4.5)",
        outcomes: ["Rockets", "Lakers"],
        outcomePrices: [0.56, 0.44],
        clobTokenIds: ["spread-rockets", "spread-lakers"],
      }),
      makeMarket({
        id: "totals",
        groupItemTitle: "O/U 208.5",
        question: "Rockets vs. Lakers: O/U 208.5",
        outcomes: ["Over", "Under"],
        outcomePrices: [0.49, 0.51],
        clobTokenIds: ["totals-over", "totals-under"],
      }),
    ];

    renderMarketList(markets);

    expect(screen.getByRole("button", { name: /Rockets/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Lakers/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Over/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Under/i })).toBeTruthy();
  });
});
