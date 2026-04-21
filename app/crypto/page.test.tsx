import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PolymarketEvent } from "@/features/events/types";

const { listEventsKeyset, CryptoSurfaceRoute, Hydrator } = vi.hoisted(() => ({
  listEventsKeyset: vi.fn(),
  CryptoSurfaceRoute: vi.fn(() => null),
  Hydrator: vi.fn(() => null),
}));

vi.mock("@/features/events/api/gamma", () => ({
  listEventsKeyset,
}));

vi.mock("@/features/crypto/components/CryptoSurfaceRoute", () => ({
  CryptoSurfaceRoute,
}));

vi.mock("@/features/realtime/Hydrator", () => ({
  Hydrator,
}));

vi.mock("next/cache", () => ({
  unstable_cache:
    <T extends (...args: never[]) => unknown>(fn: T) =>
    (...args: Parameters<T>) =>
      fn(...args),
}));

import CryptoPage from "./page";

const buildEvent = (
  id: string,
  overrides: Partial<PolymarketEvent> = {},
): PolymarketEvent => ({
  id,
  ticker: id.toUpperCase(),
  slug: `${id}-slug`,
  title: `${id} title`,
  active: true,
  closed: false,
  archived: false,
  featured: false,
  restricted: false,
  liquidity: 10_000,
  volume: 100_000,
  volume24hr: 50_000,
  negRisk: false,
  showAllOutcomes: true,
  showMarketImages: false,
  markets: [
    {
      id: `${id}-market`,
      question: `${id} question`,
      conditionId: `${id}-condition`,
      slug: `${id}-market-slug`,
      outcomes: ["Up", "Down"],
      outcomePrices: [0.52, 0.48],
      clobTokenIds: [`${id}-yes`, `${id}-no`],
      volumeNum: 10_000,
      liquidityNum: 5_000,
      lastTradePrice: 0.52,
      bestBid: 0.51,
      bestAsk: 0.53,
      volume24hr: 4_000,
      oneDayPriceChange: 0.01,
      spread: 0.01,
      acceptingOrders: true,
      closed: false,
    },
  ],
  tags: [
    { id: `${id}-tag-1`, slug: "crypto", label: "Crypto" },
    { id: `${id}-tag-2`, slug: "bitcoin", label: "Bitcoin" },
    { id: `${id}-tag-3`, slug: "up-or-down", label: "Up / Down" },
  ],
  ...overrides,
});

describe("CryptoPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches a bounded working set and hands initial filters to the client route controller", async () => {
    const events = [buildEvent("btc"), buildEvent("eth")];

    listEventsKeyset.mockResolvedValue({
      events,
      nextCursor: "cursor-1",
    });

    render(
      await CryptoPage({
        searchParams: Promise.resolve({
          family: "hit-price",
          asset: "bitcoin",
        }),
      }),
    );

    expect(listEventsKeyset).toHaveBeenCalledWith({
      tagSlug: "crypto",
      limit: 120,
      order: "volume24hr",
      ascending: false,
    });
    expect(CryptoSurfaceRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        totalCount: 2,
        facets: expect.objectContaining({
          familyTabs: expect.any(Array),
          rail: expect.objectContaining({
            timeOptions: expect.any(Array),
            assetOptions: expect.any(Array),
          }),
        }),
        initialFilters: {
          family: "all",
          time: "all",
          asset: "bitcoin",
        },
        catalogEndpoint: "/api/crypto-cards",
        initialVisibleCount: 18,
        visibleIncrement: 18,
        cards: expect.arrayContaining([
          expect.objectContaining({ id: "btc" }),
          expect.objectContaining({ id: "eth" }),
        ]),
      }),
      undefined,
    );
    expect(Hydrator).toHaveBeenCalledWith(
      expect.objectContaining({
        seeds: expect.arrayContaining([
          expect.objectContaining({ tokenId: "btc-yes" }),
          expect.objectContaining({ tokenId: "eth-yes" }),
        ]),
      }),
      undefined,
    );
  });
});
