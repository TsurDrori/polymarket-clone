import type { PolymarketEvent } from "@/features/events/types";

export type CryptoTimeBucket =
  | "all"
  | "5M"
  | "15M"
  | "1H"
  | "4h"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "pre-market";

export type CryptoMarketType =
  | "all"
  | "up-down"
  | "above-below"
  | "price-range"
  | "hit-price";

export type CryptoCoin =
  | "all"
  | "bitcoin"
  | "ethereum"
  | "solana"
  | "xrp"
  | "dogecoin"
  | "bnb"
  | "microstrategy";

type FilterOption<T extends string> = {
  value: T;
  label: string;
};

export type CryptoFacetSummary = {
  slug: string;
  label: string;
  count: number;
  totalVolume: number;
};

export type CryptoSection = {
  id: string;
  title: string;
  description: string;
  events: PolymarketEvent[];
};

export const CRYPTO_TIME_OPTIONS: readonly FilterOption<CryptoTimeBucket>[] = [
  { value: "all", label: "All" },
  { value: "5M", label: "5 Min" },
  { value: "15M", label: "15 Min" },
  { value: "1H", label: "1 Hour" },
  { value: "4h", label: "4 Hours" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "pre-market", label: "Pre-Market" },
] as const;

export const CRYPTO_MARKET_TYPE_OPTIONS: readonly FilterOption<CryptoMarketType>[] = [
  { value: "all", label: "All" },
  { value: "up-down", label: "Up / Down" },
  { value: "above-below", label: "Above / Below" },
  { value: "price-range", label: "Price Range" },
  { value: "hit-price", label: "Hit Price" },
] as const;

export const CRYPTO_COIN_OPTIONS: readonly FilterOption<CryptoCoin>[] = [
  { value: "all", label: "All assets" },
  { value: "bitcoin", label: "Bitcoin" },
  { value: "ethereum", label: "Ethereum" },
  { value: "solana", label: "Solana" },
  { value: "xrp", label: "XRP" },
  { value: "dogecoin", label: "Dogecoin" },
  { value: "bnb", label: "BNB" },
  { value: "microstrategy", label: "Microstrategy" },
] as const;

const CRYPTO_COIN_LABELS = new Map(
  CRYPTO_COIN_OPTIONS.map((option) => [option.value, option.label]),
);

const CRYPTO_MARKET_TYPE_LABELS = new Map(
  CRYPTO_MARKET_TYPE_OPTIONS.map((option) => [option.value, option.label]),
);

const CRYPTO_TIME_LABELS = new Map(
  CRYPTO_TIME_OPTIONS.map((option) => [option.value, option.label]),
);

const getTagSet = (event: PolymarketEvent): Set<string> =>
  new Set(event.tags.map((tag) => tag.slug));

export const getCryptoTimeBucket = (event: PolymarketEvent): CryptoTimeBucket => {
  const tags = getTagSet(event);
  if (tags.has("5M")) return "5M";
  if (tags.has("15M")) return "15M";
  if (tags.has("1H")) return "1H";
  if (tags.has("4h")) return "4h";
  if (tags.has("daily")) return "daily";
  if (tags.has("weekly")) return "weekly";
  if (tags.has("monthly")) return "monthly";
  if (tags.has("yearly")) return "yearly";
  if (tags.has("pre-market")) return "pre-market";
  return "all";
};

export const getCryptoMarketType = (
  event: PolymarketEvent,
): CryptoMarketType => {
  const tags = getTagSet(event);
  if (tags.has("up-or-down")) return "up-down";
  if (tags.has("multi-strikes")) return "above-below";
  if (tags.has("neg-risk")) return "price-range";
  if (tags.has("hit-price")) return "hit-price";
  return "all";
};

export const getCryptoCoin = (event: PolymarketEvent): CryptoCoin => {
  const tags = getTagSet(event);
  if (tags.has("bitcoin")) return "bitcoin";
  if (tags.has("ethereum")) return "ethereum";
  if (tags.has("solana")) return "solana";
  if (tags.has("xrp")) return "xrp";
  if (tags.has("dogecoin")) return "dogecoin";
  if (tags.has("bnb")) return "bnb";
  if (tags.has("microstrategy")) return "microstrategy";
  return "all";
};

const addFacet = (
  facets: Map<string, CryptoFacetSummary>,
  slug: string,
  label: string,
  event: PolymarketEvent,
) => {
  const existing = facets.get(slug);
  if (existing) {
    existing.count += 1;
    existing.totalVolume += event.volume24hr || event.volume;
    return;
  }

  facets.set(slug, {
    slug,
    label,
    count: 1,
    totalVolume: event.volume24hr || event.volume,
  });
};

export const buildCryptoFacets = (
  events: ReadonlyArray<PolymarketEvent>,
  limit = 6,
): CryptoFacetSummary[] => {
  const facets = new Map<string, CryptoFacetSummary>();

  for (const event of events) {
    const coin = getCryptoCoin(event);
    if (coin !== "all") {
      addFacet(
        facets,
        `coin:${coin}`,
        CRYPTO_COIN_LABELS.get(coin) ?? coin,
        event,
      );
    }

    const marketType = getCryptoMarketType(event);
    if (marketType !== "all") {
      addFacet(
        facets,
        `type:${marketType}`,
        CRYPTO_MARKET_TYPE_LABELS.get(marketType) ?? marketType,
        event,
      );
    }

    const timeBucket = getCryptoTimeBucket(event);
    if (timeBucket !== "all") {
      addFacet(
        facets,
        `time:${timeBucket}`,
        CRYPTO_TIME_LABELS.get(timeBucket) ?? timeBucket,
        event,
      );
    }
  }

  return [...facets.values()]
    .sort(
      (left, right) =>
        right.totalVolume - left.totalVolume ||
        right.count - left.count ||
        left.label.localeCompare(right.label),
    )
    .slice(0, limit);
};

export const buildCryptoSections = (
  events: ReadonlyArray<PolymarketEvent>,
  {
    sectionLimit = 3,
    eventLimit = 6,
  }: {
    sectionLimit?: number;
    eventLimit?: number;
  } = {},
): CryptoSection[] => {
  const grouped = new Map<
    CryptoCoin,
    { title: string; totalVolume: number; events: PolymarketEvent[] }
  >();

  for (const coin of CRYPTO_COIN_OPTIONS) {
    if (coin.value === "all") continue;
    grouped.set(coin.value, {
      title: coin.label,
      totalVolume: 0,
      events: [],
    });
  }

  for (const event of events) {
    const coin = getCryptoCoin(event);
    if (coin === "all") continue;

    const group = grouped.get(coin);
    if (!group) continue;
    group.events.push(event);
    group.totalVolume += event.volume24hr || event.volume;
  }

  return [...grouped.entries()]
    .filter(([, group]) => group.events.length >= 2)
    .sort(
      (left, right) =>
        right[1].totalVolume - left[1].totalVolume ||
        right[1].events.length - left[1].events.length ||
        left[1].title.localeCompare(right[1].title),
    )
    .slice(0, sectionLimit)
    .map(([coin, group]) => ({
      id: `crypto-${coin}`,
      title: group.title,
      description: `High-volume ${group.title.toLowerCase()} markets from the current crypto category slice.`,
      events: group.events.slice(0, eventLimit),
    }));
};
