import { render, screen, within } from "@testing-library/react";
import { Provider } from "jotai";
import type { ImgHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import fixture from "@/fixtures/gamma-event-sample.json";
import { parseEvent } from "@/features/events/api/parse";
import type { PolymarketEvent, PolymarketMarket } from "@/features/events/types";
import { Hydrator } from "@/features/realtime/Hydrator";
import { EventCard } from "./EventCard";

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement> & { unoptimized?: boolean }) => {
    const nextImageProps = { ...props };
    delete nextImageProps.unoptimized;

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img alt="" {...nextImageProps} />
    );
  },
}));

vi.mock("@/features/realtime/subscriptions", () => ({
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
}));

const baseEvent = parseEvent(fixture.events[0]);
const baseMarket = baseEvent.markets[0];

const binaryEvent: PolymarketEvent = {
  ...baseEvent,
  showAllOutcomes: false,
  markets: [baseMarket],
};

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
    renderEventCard(binaryEvent);

    expect(screen.getByText("Yes")).toBeTruthy();
    expect(screen.getByText("No")).toBeTruthy();
    expect(screen.getByText(/\$\d+[MBK]? Vol\./i)).toBeTruthy();

    const yesAction = screen.getByText("Yes").closest('[data-price-swap="true"]');
    const noAction = screen.getByText("No").closest('[data-price-swap="true"]');

    expect(yesAction).toBeTruthy();
    expect(noAction).toBeTruthy();

    expect(
      within(yesAction as HTMLElement).getByText(
        `${Math.round(baseMarket.outcomePrices[0] * 100)}%`,
      ),
    ).toBeTruthy();
    expect(
      within(noAction as HTMLElement).getByText(
        `${Math.round(baseMarket.outcomePrices[1] * 100)}%`,
      ),
    ).toBeTruthy();
  });

  it("keeps single-market custom outcomes as labels instead of enabling price-swap hover text", () => {
    renderEventCard({
      ...binaryEvent,
      markets: [
        makeMarket({
          id: "moneyline",
          outcomes: ["Knicks", "Celtics"],
          clobTokenIds: ["knicks-token", "celtics-token"],
          lastTradePrice: 0.58,
          outcomePrices: [0.58, 0.42],
        }),
      ],
    });

    expect(screen.getByText("Knicks").closest('[data-price-swap="true"]')).toBeNull();
    expect(screen.getByText("Celtics").closest('[data-price-swap="true"]')).toBeNull();
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
    expect(screen.queryByText(/^Yes$/i)).toBeNull();
    expect(screen.getByText("Rockets")).toBeTruthy();
    expect(screen.getByText("Lakers")).toBeTruthy();
  });

  it("renders multi-outcome rows from outcomes[0] and outcomes[1] instead of hardcoded Buy Yes/Buy No", () => {
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

    expect(screen.getByText("Rockets")).toBeTruthy();
    expect(screen.getByText("Lakers")).toBeTruthy();
    expect(screen.getByText("Over")).toBeTruthy();
    expect(screen.getByText("Under")).toBeTruthy();
  });

  it("enables hover percentage labels for grouped yes/no outcome rows", () => {
    renderEventCard({
      ...baseEvent,
      title: "What happens first?",
      slug: "what-happens-first",
      showAllOutcomes: true,
      markets: [
        makeMarket({
          id: "first",
          question: "Will event one happen first?",
          groupItemTitle: "Event one",
          outcomes: ["Yes", "No"],
          clobTokenIds: ["first-yes", "first-no"],
          lastTradePrice: 0.78,
          outcomePrices: [0.78, 0.22],
        }),
        makeMarket({
          id: "second",
          question: "Will event two happen first?",
          groupItemTitle: "Event two",
          outcomes: ["Yes", "No"],
          clobTokenIds: ["second-yes", "second-no"],
          lastTradePrice: 0.41,
          outcomePrices: [0.41, 0.59],
        }),
      ],
    });

    const yesActions = screen.getAllByText("Yes");
    const noActions = screen.getAllByText("No");

    expect(yesActions[0]?.closest('[data-price-swap="true"]')).toBeTruthy();
    expect(noActions[0]?.closest('[data-price-swap="true"]')).toBeTruthy();

    expect(
      within(yesActions[0]?.closest('[data-price-swap="true"]') as HTMLElement).getByText(
        "78%",
      ),
    ).toBeTruthy();
    expect(
      within(noActions[0]?.closest('[data-price-swap="true"]') as HTMLElement).getByText(
        "22%",
      ),
    ).toBeTruthy();
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

  it("renders a footer live label for live events", () => {
    renderEventCard({
      ...baseEvent,
      live: true,
      endDate: undefined,
    });

    expect(screen.getByText("Live")).toBeTruthy();
  });
});
