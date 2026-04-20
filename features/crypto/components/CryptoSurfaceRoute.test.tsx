import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "jotai";
import type { ImgHTMLAttributes } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildCryptoFacetState,
  buildCryptoHydrationSeeds,
  buildCryptoWorkingSet,
} from "@/features/crypto/parse";
import type {
  PolymarketEvent,
  PolymarketMarket,
  PolymarketTag,
} from "@/features/events/types";
import { CryptoSurfaceRoute } from "./CryptoSurfaceRoute";

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
  groupItemTitle: `Label ${id}`,
  outcomes: ["Yes", "No"],
  outcomePrices: [0.55, 0.45],
  clobTokenIds: [`${id}-yes`, `${id}-no`],
  volumeNum: 50_000,
  liquidityNum: 10_000,
  lastTradePrice: 0.55,
  bestBid: 0.54,
  bestAsk: 0.56,
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
  markets,
}: {
  id: string;
  slug: string;
  title: string;
  tags: PolymarketTag[];
  markets: PolymarketMarket[];
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
  markets,
  tags,
});

const buildWorkingSet = () =>
  buildCryptoWorkingSet([
    buildEvent({
      id: "up-down",
      slug: "btc-five-minute-up-or-down",
      title: "BTC 5 Minute Up or Down",
      markets: [buildMarket("up-down-1", { outcomes: ["Up", "Down"] })],
      tags: [
        { id: "1", slug: "crypto", label: "Crypto" },
        { id: "2", slug: "bitcoin", label: "Bitcoin" },
        { id: "3", slug: "5m", label: "5m" },
        { id: "4", slug: "up-or-down", label: "Up / Down" },
      ],
    }),
    buildEvent({
      id: "hit-price",
      slug: "what-price-will-bitcoin-hit-in-april",
      title: "What price will Bitcoin hit in April?",
      markets: [
        buildMarket("hit-price-1", {
          groupItemTitle: "↑ 80,000",
          lastTradePrice: 0.31,
        }),
        buildMarket("hit-price-2", {
          groupItemTitle: "↓ 65,000",
          lastTradePrice: 0.13,
        }),
      ],
      tags: [
        { id: "5", slug: "crypto", label: "Crypto" },
        { id: "6", slug: "bitcoin", label: "Bitcoin" },
        { id: "7", slug: "monthly", label: "Monthly" },
        { id: "8", slug: "hit-price", label: "Hit Price" },
      ],
    }),
    buildEvent({
      id: "price-range",
      slug: "bitcoin-price-on-april-20",
      title: "Bitcoin price on April 20?",
      markets: [
        buildMarket("range-1", {
          groupItemTitle: "74,000-76,000",
          lastTradePrice: 0.48,
        }),
        buildMarket("range-2", {
          groupItemTitle: "72,000-74,000",
          lastTradePrice: 0.29,
        }),
      ],
      tags: [
        { id: "9", slug: "crypto", label: "Crypto" },
        { id: "10", slug: "bitcoin", label: "Bitcoin" },
        { id: "11", slug: "daily", label: "Daily" },
        { id: "12", slug: "neg-risk", label: "Price Range" },
      ],
    }),
  ]);

describe("CryptoSurfaceRoute", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/crypto");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ cards: buildWorkingSet().cards }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("updates the URL and visible cards immediately on family changes", async () => {
    const workingSet = buildWorkingSet();

    render(
      <Provider>
        <CryptoSurfaceRoute
          totalCount={workingSet.cards.length}
          cards={workingSet.cards}
          facets={buildCryptoFacetState(workingSet.cards, {
            family: "all",
            time: "all",
            asset: "all",
          })}
          hydrationSeeds={buildCryptoHydrationSeeds(workingSet.cards)}
          initialFilters={{ family: "all", time: "all", asset: "all" }}
          initialVisibleCount={18}
          visibleIncrement={18}
          catalogEndpoint="/api/crypto-cards"
        />
      </Provider>,
    );

    expect(screen.getByRole("heading", { name: "BTC 5 Minute Up or Down" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "What price will Bitcoin hit in April?" })).toBeTruthy();

    fireEvent.click(screen.getByRole("link", { name: /hit price/i }));

    await waitFor(() => {
      expect(window.location.search).toBe("?family=hit-price");
      expect(
        screen.queryByRole("heading", { name: "BTC 5 Minute Up or Down" }),
      ).toBeNull();
      expect(
        screen.getByRole("heading", { name: "What price will Bitcoin hit in April?" }),
      ).toBeTruthy();
    });
  });

  it("replaces invalid filter combinations with the normalized canonical query", async () => {
    const workingSet = buildWorkingSet();

    window.history.replaceState(
      null,
      "",
      "/crypto?family=price-range&time=5m&asset=bitcoin",
    );

    render(
      <Provider>
        <CryptoSurfaceRoute
          totalCount={workingSet.cards.length}
          cards={workingSet.cards}
          facets={buildCryptoFacetState(workingSet.cards, {
            family: "price-range",
            time: "5m",
            asset: "bitcoin",
          })}
          hydrationSeeds={buildCryptoHydrationSeeds(workingSet.cards)}
          initialFilters={{ family: "price-range", time: "5m", asset: "bitcoin" }}
          initialVisibleCount={18}
          visibleIncrement={18}
          catalogEndpoint="/api/crypto-cards"
        />
      </Provider>,
    );

    await waitFor(() => {
      expect(window.location.search).toBe("?time=5m&asset=bitcoin");
      expect(screen.getByRole("heading", { name: "BTC 5 Minute Up or Down" })).toBeTruthy();
    });
  });

  it("syncs the rendered cards when browser history changes", async () => {
    const workingSet = buildWorkingSet();

    render(
      <Provider>
        <CryptoSurfaceRoute
          totalCount={workingSet.cards.length}
          cards={workingSet.cards}
          facets={buildCryptoFacetState(workingSet.cards, {
            family: "all",
            time: "all",
            asset: "all",
          })}
          hydrationSeeds={buildCryptoHydrationSeeds(workingSet.cards)}
          initialFilters={{ family: "all", time: "all", asset: "all" }}
          initialVisibleCount={18}
          visibleIncrement={18}
          catalogEndpoint="/api/crypto-cards"
        />
      </Provider>,
    );

    act(() => {
      window.history.pushState(null, "", "/crypto?family=price-range");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "BTC 5 Minute Up or Down" })).toBeNull();
      expect(screen.getByRole("heading", { name: "Bitcoin price on April 20?" })).toBeTruthy();
    });
  });
});
