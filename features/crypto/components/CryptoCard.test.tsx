import { act, render, screen } from "@testing-library/react";
import { Provider } from "jotai";
import type { ImgHTMLAttributes } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  PolymarketEvent,
  PolymarketMarket,
  PolymarketTag,
} from "@/features/events/types";
import { buildCryptoWorkingSet } from "@/features/crypto/parse";
import { priceAtomFamily } from "@/features/realtime/atoms";
import { Hydrator } from "@/features/realtime/Hydrator";
import {
  __resetRealtimeStoreForTests,
  getRealtimeStore,
} from "@/features/realtime/store";
import { CryptoCard } from "./CryptoCard";

vi.mock("@/features/realtime/subscriptions", () => ({
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
}));

vi.mock("@/features/market-cards/components/LivePriceDelta", () => ({
  LivePriceDelta: () => <span>LIVE-DELTA</span>,
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
}: {
  id: string;
  slug: string;
  title: string;
  tags: PolymarketTag[];
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
  volume24hr: 100_000,
  negRisk: false,
  showAllOutcomes: true,
  showMarketImages: false,
  markets: [buildMarket(`${id}-1`)],
  tags,
});

describe("CryptoCard", () => {
  afterEach(() => {
    __resetRealtimeStoreForTests();
  });

  it("keeps the single-card value and gauge progress aligned for the same live token", () => {
    const store = getRealtimeStore();
    const event = buildEvent({
      id: "btc-up",
      slug: "btc-5-minute-up-or-down",
      title: "BTC 5 Minute Up or Down",
      tags: [
        { id: "1", slug: "crypto", label: "Crypto" },
        { id: "2", slug: "bitcoin", label: "Bitcoin" },
        { id: "3", slug: "5M", label: "5M" },
        { id: "4", slug: "up-or-down", label: "Up / Down" },
      ],
    });
    const workingSet = buildCryptoWorkingSet([event]);
    const card = workingSet.cards[0];

    if (!card) {
      throw new Error("Expected a crypto card to be built for the test event.");
    }

    const tokenId = card.primarySnippet.tokenId;
    if (!tokenId) {
      throw new Error("Expected the primary crypto snippet to expose a live token.");
    }

    render(
      <Provider store={store}>
        <Hydrator events={[event]} />
        <CryptoCard card={card} />
      </Provider>,
    );

    expect(screen.getByText("51%")).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(
      String(card.primarySnippet.fallbackPrice),
    );

    act(() => {
      const prevTick = store.get(priceAtomFamily(tokenId));

      store.set(priceAtomFamily(tokenId), {
        ...prevTick,
        price: 0.61,
        ts: prevTick.ts + 1,
      });
    });

    expect(screen.getByText("61%")).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("0.61");
  });

  it("renders the live delta footer on single crypto cards", () => {
    const event = buildEvent({
      id: "btc-up",
      slug: "btc-5-minute-up-or-down",
      title: "BTC 5 Minute Up or Down",
      tags: [
        { id: "1", slug: "crypto", label: "Crypto" },
        { id: "2", slug: "bitcoin", label: "Bitcoin" },
        { id: "3", slug: "5M", label: "5M" },
        { id: "4", slug: "up-or-down", label: "Up / Down" },
      ],
    });
    const workingSet = buildCryptoWorkingSet([event]);
    const card = workingSet.cards[0];

    if (!card) {
      throw new Error("Expected a crypto card to be built for the test event.");
    }

    render(
      <Provider store={getRealtimeStore()}>
        <Hydrator events={[event]} />
        <CryptoCard card={card} />
      </Provider>,
    );

    expect(screen.getByText("LIVE-DELTA")).toBeTruthy();
  });
});
