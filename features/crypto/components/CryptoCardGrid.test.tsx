import { act, fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "jotai";
import type { ImgHTMLAttributes } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  PolymarketEvent,
  PolymarketMarket,
  PolymarketTag,
} from "@/features/events/types";
import {
  buildCryptoHydrationSeeds,
  buildCryptoWorkingSet,
} from "@/features/crypto/parse";
import { priceAtomFamily } from "@/features/realtime/atoms";
import { Hydrator } from "@/features/realtime/Hydrator";
import {
  __resetRealtimeStoreForTests,
  getRealtimeStore,
} from "@/features/realtime/store";
import { CryptoCardGrid } from "./CryptoCardGrid";

vi.mock("@/features/realtime/subscriptions", () => ({
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
}));

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" {...props} />
  ),
}));

const buildMarket = (
  id: string,
  overrides: Partial<PolymarketMarket> = {},
): PolymarketMarket => ({
  id,
  question: `Question ${id}`,
  conditionId: `condition-${id}`,
  slug: `market-${id}`,
  groupItemTitle: undefined,
  outcomes: ["Up", "Down"],
  outcomePrices: [0.51, 0.49],
  clobTokenIds: [`${id}-yes`, `${id}-no`],
  volumeNum: 50_000,
  liquidityNum: 10_000,
  lastTradePrice: 0.51,
  bestBid: 0.5,
  bestAsk: 0.52,
  volume24hr: 5_000,
  oneDayPriceChange: 0.02,
  spread: 0.01,
  acceptingOrders: true,
  closed: false,
  ...overrides,
});

const buildEvent = ({
  id,
  slug,
  title,
  tags,
  volume24hr = 100_000,
}: {
  id: string;
  slug: string;
  title: string;
  tags: PolymarketTag[];
  volume24hr?: number;
}): PolymarketEvent => ({
  id,
  ticker: title.slice(0, 3).toUpperCase(),
  slug,
  title,
  active: true,
  closed: false,
  archived: false,
  featured: false,
  restricted: false,
  liquidity: 100_000,
  volume: 1_000_000,
  volume24hr,
  negRisk: false,
  showAllOutcomes: true,
  showMarketImages: false,
  markets: [buildMarket(`${id}-1`)],
  tags,
});

describe("CryptoCardGrid", () => {
  afterEach(() => {
    __resetRealtimeStoreForTests();
  });

  it("reveals more cards with the continuation button", () => {
    const store = getRealtimeStore();
    const workingSet = buildCryptoWorkingSet(
      ["BTC One", "BTC Two", "BTC Three", "BTC Four"].map((title, index) =>
        buildEvent({
          id: `btc-${index + 1}`,
          slug: `btc-${index + 1}`,
          title,
          tags: [
            { id: `${index}-1`, slug: "crypto", label: "Crypto" },
            { id: `${index}-2`, slug: "bitcoin", label: "Bitcoin" },
            { id: `${index}-3`, slug: "5M", label: "5M" },
            { id: `${index}-4`, slug: "up-or-down", label: "Up / Down" },
          ],
        }),
      ),
    );

    render(
      <Provider store={store}>
        <Hydrator seeds={buildCryptoHydrationSeeds(workingSet.cards)} />
        <CryptoCardGrid cards={workingSet.cards} initialCount={2} incrementCount={2} />
      </Provider>,
    );

    expect(screen.getByRole("heading", { name: "BTC One" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "BTC Two" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "BTC Three" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /show more markets/i }));

    expect(screen.getByRole("heading", { name: "BTC Three" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "BTC Four" })).toBeTruthy();
  });

  it("keeps card positions stable when an overscan candidate gets hotter", () => {
    const store = getRealtimeStore();
    const workingSet = buildCryptoWorkingSet([
      buildEvent({
        id: "btc-1",
        slug: "btc-1",
        title: "BTC One",
        volume24hr: 500_000,
        tags: [
          { id: "1", slug: "crypto", label: "Crypto" },
          { id: "2", slug: "bitcoin", label: "Bitcoin" },
          { id: "3", slug: "5M", label: "5M" },
          { id: "4", slug: "up-or-down", label: "Up / Down" },
        ],
      }),
      buildEvent({
        id: "btc-2",
        slug: "btc-2",
        title: "BTC Two",
        volume24hr: 400_000,
        tags: [
          { id: "5", slug: "crypto", label: "Crypto" },
          { id: "6", slug: "bitcoin", label: "Bitcoin" },
          { id: "7", slug: "5M", label: "5M" },
          { id: "8", slug: "up-or-down", label: "Up / Down" },
        ],
      }),
      buildEvent({
        id: "btc-3",
        slug: "btc-3",
        title: "BTC Three",
        volume24hr: 300_000,
        tags: [
          { id: "9", slug: "crypto", label: "Crypto" },
          { id: "10", slug: "bitcoin", label: "Bitcoin" },
          { id: "11", slug: "5M", label: "5M" },
          { id: "12", slug: "up-or-down", label: "Up / Down" },
        ],
      }),
    ]);
    const promotedCard = workingSet.cards[2];

    if (!promotedCard?.primarySnippet.tokenId) {
      throw new Error("Expected a promoted crypto candidate with a token.");
    }

    render(
      <Provider store={store}>
        <Hydrator seeds={buildCryptoHydrationSeeds(workingSet.cards)} />
        <CryptoCardGrid cards={workingSet.cards} initialCount={2} incrementCount={2} />
      </Provider>,
    );

    expect(screen.getByRole("heading", { name: "BTC One" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "BTC Two" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "BTC Three" })).toBeNull();

    act(() => {
      const prevTick = store.get(priceAtomFamily(promotedCard.primarySnippet.tokenId!));

      store.set(priceAtomFamily(promotedCard.primarySnippet.tokenId!), {
        ...prevTick,
        price: 0.99,
        ts: prevTick.ts + 1,
      });
    });

    expect(screen.queryByRole("heading", { name: "BTC Three" })).toBeNull();
    expect(screen.getByRole("heading", { name: "BTC Two" })).toBeTruthy();
  });
});
