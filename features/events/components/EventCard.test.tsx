import { render, screen, within } from "@testing-library/react";
import { Provider } from "jotai";
import type { ImgHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import fixture from "@/fixtures/gamma-event-sample.json";
import { parseEvent } from "@/features/events/api/parse";
import type { PolymarketEvent, PolymarketMarket } from "@/features/events/types";
import { Hydrator } from "@/features/realtime/Hydrator";
import { EventCard } from "./EventCard";

const { push } = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" {...props} />
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
  }),
}));

vi.mock("@/features/realtime/subscriptions", () => ({
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
}));

const baseEvent = parseEvent(fixture.events[0]);
const baseMarket = baseEvent.markets[0];

const makeMarket = (
  overrides: Partial<PolymarketMarket> & Pick<PolymarketMarket, "id">,
): PolymarketMarket => ({
  ...baseMarket,
  ...overrides,
});

const renderEventCard = (event: PolymarketEvent) =>
  render(
    <Provider>
      <Hydrator events={[event]} />
      <EventCard event={event} />
    </Provider>,
  );

describe("EventCard", () => {
  it("dispatches single-market events to BinaryBody", () => {
    renderEventCard(baseEvent);

    expect(screen.getByRole("button", { name: /Buy Yes/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Buy No/i })).toBeTruthy();
  });

  it("dispatches showAllOutcomes multi-market events to MultiOutcomeBody", () => {
    const event: PolymarketEvent = {
      ...baseEvent,
      title: "Rockets vs. Lakers",
      slug: "nba-hou-lal-2026-04-18",
      showAllOutcomes: true,
      markets: [
        makeMarket({
          id: "spread",
          question: "Spread: Rockets (-4.5)",
          groupItemTitle: "Spread -4.5",
          outcomes: ["Rockets", "Lakers"],
          clobTokenIds: ["spread-rockets", "spread-lakers"],
          volumeNum: 2_000_000,
          lastTradePrice: 0.56,
          outcomePrices: [0.56, 0.44],
        }),
        makeMarket({
          id: "totals",
          question: "Rockets vs. Lakers: O/U 208.5",
          groupItemTitle: "O/U 208.5",
          outcomes: ["Over", "Under"],
          clobTokenIds: ["totals-over", "totals-under"],
          volumeNum: 1_500_000,
          lastTradePrice: 0.49,
          outcomePrices: [0.49, 0.51],
        }),
      ],
    };

    renderEventCard(event);

    expect(screen.getByText("Spread -4.5")).toBeTruthy();
    expect(screen.getByText("O/U 208.5")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Buy Yes/i })).toBeNull();
  });

  it("renders multi-outcome rows from outcomes[0] and outcomes[1] instead of hardcoded Yes/No", () => {
    const event: PolymarketEvent = {
      ...baseEvent,
      title: "Rockets vs. Lakers",
      slug: "nba-hou-lal-2026-04-18",
      showAllOutcomes: true,
      markets: [
        makeMarket({
          id: "moneyline",
          question: "Rockets vs. Lakers",
          groupItemTitle: undefined,
          outcomes: ["Rockets", "Lakers"],
          clobTokenIds: ["moneyline-rockets", "moneyline-lakers"],
          volumeNum: 3_000_000,
          lastTradePrice: 0.52,
          outcomePrices: [0.52, 0.48],
        }),
        makeMarket({
          id: "totals",
          question: "Rockets vs. Lakers: O/U 208.5",
          groupItemTitle: "O/U 208.5",
          outcomes: ["Over", "Under"],
          clobTokenIds: ["totals-over", "totals-under"],
          volumeNum: 2_000_000,
          lastTradePrice: 0.49,
          outcomePrices: [0.49, 0.51],
        }),
      ],
    };

    renderEventCard(event);

    expect(screen.getByRole("button", { name: /Rockets/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Lakers/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Over/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Under/i })).toBeTruthy();
  });

  it("falls back to question when groupItemTitle is nullish", () => {
    const event: PolymarketEvent = {
      ...baseEvent,
      title: "Hawks vs. Knicks",
      slug: "nba-atl-nyk-2026-04-18",
      showAllOutcomes: true,
      markets: [
        makeMarket({
          id: "moneyline",
          question: "Moneyline: Hawks vs. Knicks",
          groupItemTitle: undefined,
          outcomes: ["Hawks", "Knicks"],
          clobTokenIds: ["moneyline-hawks", "moneyline-knicks"],
          volumeNum: 3_500_000,
          lastTradePrice: 0.61,
          outcomePrices: [0.61, 0.39],
        }),
        makeMarket({
          id: "first-half",
          question: "Hawks vs. Knicks: 1H Moneyline",
          groupItemTitle: "1H Moneyline",
          outcomes: ["Hawks", "Knicks"],
          clobTokenIds: ["first-half-hawks", "first-half-knicks"],
          volumeNum: 2_500_000,
          lastTradePrice: 0.58,
          outcomePrices: [0.58, 0.42],
        }),
      ],
    };

    renderEventCard(event);

    const card = screen.getByRole("article");
    expect(within(card).getByText("Moneyline: Hawks vs. Knicks")).toBeTruthy();
  });
});
