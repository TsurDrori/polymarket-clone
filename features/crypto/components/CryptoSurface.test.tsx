import { render, screen, within } from "@testing-library/react";
import { Provider } from "jotai";
import type { ImgHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import type {
  PolymarketEvent,
  PolymarketMarket,
  PolymarketTag,
} from "@/features/events/types";
import { Hydrator } from "@/features/realtime/Hydrator";
import {
  buildCryptoHydrationSeeds,
  buildCryptoFacetState,
  buildCryptoWorkingSet,
  filterCryptoCards,
  normalizeCryptoFilters,
  type CryptoFilterState,
} from "../parse";
import { CryptoSurface } from "./CryptoSurface";

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
  outcomePrices: [0.5, 0.5],
  clobTokenIds: [`${id}-yes`, `${id}-no`],
  volumeNum: 50_000,
  liquidityNum: 10_000,
  lastTradePrice: 0.5,
  bestBid: 0.49,
  bestAsk: 0.51,
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
  markets: [
    buildMarket(`${id}-1`, {
      groupItemTitle: "74,000-76,000",
      lastTradePrice: 0.89,
    }),
    buildMarket(`${id}-2`, {
      groupItemTitle: "72,000-74,000",
      lastTradePrice: 0.07,
    }),
  ],
  tags,
});

describe("CryptoSurface", () => {
  it("renders the dedicated crypto shell with tabs, rail filters, and cards", () => {
    const workingSet = buildCryptoWorkingSet([
      buildEvent({
        id: "btc",
        slug: "bitcoin-price-on-april-19",
        title: "Bitcoin price on April 19?",
        tags: [
          { id: "1", slug: "crypto", label: "Crypto" },
          { id: "2", slug: "bitcoin", label: "Bitcoin" },
          { id: "3", slug: "weekly", label: "Weekly" },
          { id: "4", slug: "neg-risk", label: "Price Range" },
        ],
      }),
      buildEvent({
        id: "eth",
        slug: "what-price-will-ethereum-hit-in-april",
        title: "What price will Ethereum hit in April?",
        tags: [
          { id: "5", slug: "crypto", label: "Crypto" },
          { id: "6", slug: "ethereum", label: "Ethereum" },
          { id: "7", slug: "monthly", label: "Monthly" },
          { id: "8", slug: "hit-price", label: "Hit Price" },
        ],
      }),
    ]);

    const filters: CryptoFilterState = normalizeCryptoFilters(
      {
        family: "all",
        time: "all",
        asset: "all",
      },
      workingSet,
    );
    const facets = buildCryptoFacetState(workingSet.cards, filters);
    const cards = filterCryptoCards(workingSet.cards, filters);

    render(
      <Provider>
        <Hydrator seeds={buildCryptoHydrationSeeds(cards)} />
        <CryptoSurface
          totalCount={workingSet.cards.length}
          facets={facets}
          filters={filters}
          cards={cards}
        />
      </Provider>,
    );

    expect(screen.getByRole("heading", { name: "Crypto" })).toBeTruthy();
    expect(screen.getByRole("navigation", { name: /crypto market families/i })).toBeTruthy();
    const rail = screen.getByLabelText(/crypto filters/i);
    expect(rail).toBeTruthy();
    expect(within(rail).queryByRole("heading", { name: "Markets" })).toBeNull();
    expect(within(rail).queryByRole("heading", { name: "Assets" })).toBeNull();
    expect(within(rail).getByRole("link", { name: /Bitcoin/i })).toBeTruthy();
    expect(within(rail).getByRole("link", { name: /Ethereum/i })).toBeTruthy();
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: /price/i }).length).toBeGreaterThan(0);
  });
});
