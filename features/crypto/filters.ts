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
