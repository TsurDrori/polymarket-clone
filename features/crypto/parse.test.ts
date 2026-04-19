import { describe, expect, it } from "vitest";
import type {
  PolymarketEvent,
  PolymarketMarket,
  PolymarketTag,
} from "@/features/events/types";
import {
  buildCryptoFacetState,
  buildCryptoWorkingSet,
  deriveCryptoAsset,
  deriveCryptoFamily,
  deriveCryptoTimeBucket,
  filterCryptoCards,
  normalizeCryptoFilters,
  parseCryptoSearchParams,
} from "./parse";

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
  markets,
}: {
  id: string;
  slug: string;
  title: string;
  tags: PolymarketTag[];
  markets?: PolymarketMarket[];
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
  markets:
    markets ??
    [
      buildMarket(`${id}-1`, {
        groupItemTitle: "Primary",
      }),
      buildMarket(`${id}-2`, {
        groupItemTitle: "Secondary",
        lastTradePrice: 0.24,
      }),
    ],
  tags,
});

describe("crypto parser", () => {
  it("derives time, family, and asset from current crypto tags", () => {
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
      markets: [
        buildMarket("btc-up-market", {
          groupItemTitle: undefined,
          outcomes: ["Up", "Down"],
          lastTradePrice: 0.51,
        }),
      ],
    });

    expect(deriveCryptoTimeBucket(event)).toBe("5m");
    expect(deriveCryptoFamily(event)).toBe("up-down");
    expect(deriveCryptoAsset(event)).toBe("bitcoin");
  });

  it("omits unsupported controls while keeping unsupported events in the all feed", () => {
    const supported = buildEvent({
      id: "eth-above",
      slug: "eth-above",
      title: "Ethereum above ___ on April 19?",
      tags: [
        { id: "1", slug: "crypto", label: "Crypto" },
        { id: "2", slug: "ethereum", label: "Ethereum" },
        { id: "3", slug: "weekly", label: "Weekly" },
        { id: "4", slug: "multi-strikes", label: "Above / Below" },
      ],
    });
    const unsupported = buildEvent({
      id: "hack",
      slug: "another-crypto-hack-over-100m-by-december-31",
      title: "Another crypto hack over $100m by December 31?",
      tags: [{ id: "5", slug: "crypto", label: "Crypto" }],
      markets: [buildMarket("hack-market")],
    });

    const workingSet = buildCryptoWorkingSet([supported, unsupported]);
    const facets = buildCryptoFacetState(workingSet.cards, {
      family: "all",
      time: "all",
      asset: "all",
    });

    expect(facets.familyTabs.map((option) => option.value)).toEqual([
      "all",
      "above-below",
    ]);
    expect(facets.rail.timeOptions.map((option) => option.value)).toEqual([
      "all",
      "weekly",
    ]);
    expect(facets.rail.assetOptions.map((option) => option.value)).toEqual([
      "all",
      "ethereum",
    ]);
    expect(workingSet.cards).toHaveLength(2);
  });

  it("builds contextual facet options from the active cross-filter state", () => {
    const weeklyBitcoin = buildEvent({
      id: "btc-above",
      slug: "bitcoin-above-weekly",
      title: "Bitcoin above ___ this week?",
      tags: [
        { id: "1", slug: "crypto", label: "Crypto" },
        { id: "2", slug: "bitcoin", label: "Bitcoin" },
        { id: "3", slug: "weekly", label: "Weekly" },
        { id: "4", slug: "multi-strikes", label: "Above / Below" },
      ],
    });
    const monthlyEthereum = buildEvent({
      id: "eth-hit",
      slug: "ethereum-hit-monthly",
      title: "What price will Ethereum hit this month?",
      tags: [
        { id: "5", slug: "crypto", label: "Crypto" },
        { id: "6", slug: "ethereum", label: "Ethereum" },
        { id: "7", slug: "monthly", label: "Monthly" },
        { id: "8", slug: "hit-price", label: "Hit Price" },
      ],
    });
    const dailyDogecoin = buildEvent({
      id: "doge-hit",
      slug: "dogecoin-hit-daily",
      title: "What price will Dogecoin hit today?",
      tags: [
        { id: "9", slug: "crypto", label: "Crypto" },
        { id: "10", slug: "dogecoin", label: "Dogecoin" },
        { id: "11", slug: "daily", label: "Daily" },
        { id: "12", slug: "hit-price", label: "Hit Price" },
      ],
    });

    const workingSet = buildCryptoWorkingSet([
      weeklyBitcoin,
      monthlyEthereum,
      dailyDogecoin,
    ]);
    const facets = buildCryptoFacetState(workingSet.cards, {
      family: "all",
      time: "all",
      asset: "dogecoin",
    });

    expect(facets.familyTabs.map((option) => option.value)).toEqual([
      "all",
      "hit-price",
    ]);
    expect(facets.rail.timeOptions.map((option) => option.value)).toEqual([
      "all",
      "daily",
    ]);
    expect(
      filterCryptoCards(
        workingSet.cards,
        parseCryptoSearchParams({
          family: "hit-price",
          time: "daily",
          asset: "dogecoin",
        }),
      ),
    ).toHaveLength(1);
  });

  it("normalizes impossible direct URL combinations back to supported filters", () => {
    const weeklyAboveBelow = buildEvent({
      id: "btc-above",
      slug: "bitcoin-above-weekly",
      title: "Bitcoin above ___ this week?",
      tags: [
        { id: "1", slug: "crypto", label: "Crypto" },
        { id: "2", slug: "bitcoin", label: "Bitcoin" },
        { id: "3", slug: "weekly", label: "Weekly" },
        { id: "4", slug: "multi-strikes", label: "Above / Below" },
      ],
    });
    const monthlyEthereum = buildEvent({
      id: "eth-hit",
      slug: "ethereum-hit-monthly",
      title: "What price will Ethereum hit this month?",
      tags: [
        { id: "5", slug: "crypto", label: "Crypto" },
        { id: "6", slug: "ethereum", label: "Ethereum" },
        { id: "7", slug: "monthly", label: "Monthly" },
        { id: "8", slug: "hit-price", label: "Hit Price" },
      ],
    });
    const dailyDogecoin = buildEvent({
      id: "doge-hit",
      slug: "dogecoin-hit-daily",
      title: "What price will Dogecoin hit today?",
      tags: [
        { id: "9", slug: "crypto", label: "Crypto" },
        { id: "10", slug: "dogecoin", label: "Dogecoin" },
        { id: "11", slug: "daily", label: "Daily" },
        { id: "12", slug: "hit-price", label: "Hit Price" },
      ],
    });

    const workingSet = buildCryptoWorkingSet([
      weeklyAboveBelow,
      monthlyEthereum,
      dailyDogecoin,
    ]);

    expect(
      normalizeCryptoFilters(
        {
          family: "above-below",
          time: "monthly",
          asset: "all",
        },
        workingSet,
      ),
    ).toEqual({
      family: "all",
      time: "monthly",
      asset: "all",
    });
    expect(
      normalizeCryptoFilters(
        {
          family: "all",
          time: "weekly",
          asset: "dogecoin",
        },
        workingSet,
      ),
    ).toEqual({
      family: "all",
      time: "all",
      asset: "dogecoin",
    });
  });

  it("selects deterministic lead snippets for price-range and hit-price events", () => {
    const priceRangeEvent = buildEvent({
      id: "btc-price-range",
      slug: "bitcoin-price-on-april-19",
      title: "Bitcoin price on April 19?",
      tags: [
        { id: "1", slug: "crypto", label: "Crypto" },
        { id: "2", slug: "bitcoin", label: "Bitcoin" },
        { id: "3", slug: "weekly", label: "Weekly" },
        { id: "4", slug: "neg-risk", label: "Price Range" },
      ],
      markets: [
        buildMarket("range-1", {
          groupItemTitle: "72,000-74,000",
          lastTradePrice: 0.06,
        }),
        buildMarket("range-2", {
          groupItemTitle: "74,000-76,000",
          lastTradePrice: 0.89,
        }),
        buildMarket("range-3", {
          groupItemTitle: "76,000-78,000",
          lastTradePrice: 0.07,
        }),
      ],
    });
    const hitPriceEvent = buildEvent({
      id: "btc-hit",
      slug: "what-price-will-bitcoin-hit-in-april",
      title: "What price will Bitcoin hit in April?",
      tags: [
        { id: "5", slug: "crypto", label: "Crypto" },
        { id: "6", slug: "bitcoin", label: "Bitcoin" },
        { id: "7", slug: "monthly", label: "Monthly" },
        { id: "8", slug: "hit-price", label: "Hit Price" },
      ],
      markets: [
        buildMarket("hit-down-1", {
          groupItemTitle: "↓ 60,000",
          lastTradePrice: 0.03,
        }),
        buildMarket("hit-up-1", {
          groupItemTitle: "↑ 80,000",
          lastTradePrice: 0.32,
        }),
        buildMarket("hit-down-2", {
          groupItemTitle: "↓ 65,000",
          lastTradePrice: 0.14,
        }),
        buildMarket("hit-up-2", {
          groupItemTitle: "↑ 75,000",
          lastTradePrice: 0.999,
        }),
      ],
    });

    const workingSet = buildCryptoWorkingSet([priceRangeEvent, hitPriceEvent]);

    expect(workingSet.cards[0]?.snippets.map((snippet) => snippet.label)).toEqual([
      "74,000-76,000",
      "72,000-74,000",
    ]);
    expect(workingSet.cards[1]?.snippets.map((snippet) => snippet.label)).toEqual([
      "↑ 80,000",
      "↓ 65,000",
    ]);
  });
});
