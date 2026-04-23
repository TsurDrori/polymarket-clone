import { getEventImage } from "@/features/events/api/parse";
import type { PriceHydrationSeed } from "@/features/realtime/Hydrator";
import type {
  PolymarketEvent,
  PolymarketMarket,
} from "@/features/events/types";
import { formatVolume } from "@/shared/lib/format";

type SearchParamValue = string | string[] | undefined;

export type CryptoFamily =
  | "all"
  | "up-down"
  | "above-below"
  | "price-range"
  | "hit-price";

export type CryptoCardFamily = Exclude<CryptoFamily, "all"> | "other";

export type CryptoTimeBucket =
  | "all"
  | "5m"
  | "15m"
  | "1h"
  | "4h"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "pre-market";

export type CryptoCardTimeBucket = Exclude<CryptoTimeBucket, "all"> | "other";

export type CryptoAsset =
  | "all"
  | "bitcoin"
  | "ethereum"
  | "solana"
  | "xrp"
  | "dogecoin"
  | "bnb"
  | "microstrategy";

export type CryptoCardAsset = Exclude<CryptoAsset, "all"> | "other";

export type CryptoFilterState = {
  family: CryptoFamily;
  time: CryptoTimeBucket;
  asset: CryptoAsset;
};

export type CryptoFacetOption<T extends string = string> = {
  value: T;
  label: string;
  count: number;
};

export type CryptoFacetRail = {
  timeOptions: ReadonlyArray<CryptoFacetOption<CryptoTimeBucket>>;
  assetOptions: ReadonlyArray<CryptoFacetOption<CryptoAsset>>;
};

export type CryptoFacetState = {
  familyTabs: ReadonlyArray<CryptoFacetOption<CryptoFamily>>;
  rail: CryptoFacetRail;
};

export type CryptoCardSnippet = {
  id: string;
  marketId: string;
  label: string;
  tokenId: string | null;
  fallbackPrice: number;
  bestBid: number;
  bestAsk: number;
  primaryOutcomeLabel: string;
  secondaryOutcomeLabel: string;
};

export type CryptoCardModel = {
  id: string;
  slug: string;
  title: string;
  imageSrc: string | null;
  family: CryptoCardFamily;
  timeBucket: CryptoCardTimeBucket;
  asset: CryptoCardAsset;
  showLiveDot: boolean;
  volumeLabel: string;
  metaLabel: string | null;
  variant: "single" | "list";
  sortVolume: number;
  primarySnippet: CryptoCardSnippet;
  snippets: ReadonlyArray<CryptoCardSnippet>;
};

export type CryptoWorkingSet = {
  cards: ReadonlyArray<CryptoCardModel>;
};

export type CryptoResolvedSurfaceState = {
  filters: CryptoFilterState;
  facets: CryptoFacetState;
  cards: ReadonlyArray<CryptoCardModel>;
  hydrationSeeds: ReadonlyArray<PriceHydrationSeed>;
};

export const CRYPTO_INITIAL_VISIBLE_COUNT = 18;
export const CRYPTO_VISIBLE_INCREMENT = 18;
export const CRYPTO_OVERSCAN_COUNT = 8;

export const DEFAULT_CRYPTO_FILTERS: CryptoFilterState = {
  family: "all",
  time: "all",
  asset: "all",
};

const FAMILY_ORDER: readonly CryptoFamily[] = [
  "all",
  "up-down",
  "above-below",
  "price-range",
  "hit-price",
];

const TIME_ORDER: readonly CryptoTimeBucket[] = [
  "all",
  "5m",
  "15m",
  "1h",
  "4h",
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "pre-market",
];

const ASSET_ORDER: readonly CryptoAsset[] = [
  "all",
  "bitcoin",
  "ethereum",
  "solana",
  "xrp",
  "dogecoin",
  "bnb",
  "microstrategy",
];

export const FAMILY_LABELS: Record<CryptoFamily, string> = {
  all: "All",
  "up-down": "Up / Down",
  "above-below": "Above / Below",
  "price-range": "Price Range",
  "hit-price": "Hit Price",
};

export const TIME_LABELS: Record<CryptoTimeBucket, string> = {
  all: "All",
  "5m": "5 Min",
  "15m": "15 Min",
  "1h": "1 Hour",
  "4h": "4 Hours",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
  "pre-market": "Pre-Market",
};

export const ASSET_LABELS: Record<CryptoAsset, string> = {
  all: "All",
  bitcoin: "Bitcoin",
  ethereum: "Ethereum",
  solana: "Solana",
  xrp: "XRP",
  dogecoin: "Dogecoin",
  bnb: "BNB",
  microstrategy: "Microstrategy",
};

const CERTAINTY_THRESHOLD = 0.995;
const HOT_CRYPTO_MIN_PRICE = 0.02;
const HOT_CRYPTO_MAX_PRICE = 0.98;
const CRYPTO_TIME_BUCKET_PRIORITY: Record<CryptoCardTimeBucket, number> = {
  "5m": 0,
  "15m": 1,
  "1h": 2,
  "4h": 3,
  daily: 4,
  weekly: 5,
  monthly: 6,
  yearly: 7,
  "pre-market": 8,
  other: 9,
};

const asSingleValue = (value: SearchParamValue): string | undefined =>
  Array.isArray(value) ? value[0] : value;

const normalizeText = (value: string): string => value.trim().toLowerCase();

const getTagSet = (event: PolymarketEvent): Set<string> =>
  new Set(event.tags.map((tag) => normalizeText(tag.slug)));

const getYesPrice = (market: PolymarketMarket): number => {
  if (Number.isFinite(market.lastTradePrice) && market.lastTradePrice > 0) {
    return market.lastTradePrice;
  }

  const outcomePrice = market.outcomePrices[0];
  if (Number.isFinite(outcomePrice)) {
    return outcomePrice;
  }

  return 0;
};

const getMarketLabel = (market: PolymarketMarket): string =>
  market.groupItemTitle?.trim() || market.question.trim();

const getEventTimestamp = (event: PolymarketEvent): number => {
  const candidate = event.endDate ?? event.startDate ?? event.creationDate;
  if (!candidate) return Number.MAX_SAFE_INTEGER;

  const parsed = Date.parse(candidate);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
};

const getFallbackSnippetMarkets = (
  markets: ReadonlyArray<PolymarketMarket>,
): PolymarketMarket[] =>
  markets.slice(0, Math.min(markets.length, 2));

const getNumericSortKey = (label: string): number | null => {
  const matches = label.match(/[\d,]+(?:\.\d+)?/g);
  if (!matches || matches.length === 0) {
    return null;
  }

  const first = matches[0]?.replaceAll(",", "");
  if (!first) {
    return null;
  }

  const parsed = Number(first);
  return Number.isFinite(parsed) ? parsed : null;
};

const getPriceRangeMarkets = (
  markets: ReadonlyArray<PolymarketMarket>,
): PolymarketMarket[] => {
  if (markets.length <= 2) {
    return [...markets];
  }

  let bestIndex = 0;
  let bestPrice = -1;

  markets.forEach((market, index) => {
    const price = getYesPrice(market);
    if (price > bestPrice) {
      bestPrice = price;
      bestIndex = index;
    }
  });

  const neighborIndex = bestIndex > 0 ? bestIndex - 1 : bestIndex + 1;
  const neighbor = markets[neighborIndex];

  return neighbor ? [markets[bestIndex], neighbor] : [markets[bestIndex]];
};

const getHitPriceMarkets = (
  markets: ReadonlyArray<PolymarketMarket>,
): PolymarketMarket[] => {
  type ThresholdMarket = {
    market: PolymarketMarket;
    label: string;
    direction: "up" | "down" | null;
    threshold: number | null;
    yesPrice: number;
  };

  const thresholdMarkets: ThresholdMarket[] = markets.map((market) => {
    const label = getMarketLabel(market);
    return {
      market,
      label,
      direction:
        label.startsWith("↑") ? "up" : label.startsWith("↓") ? "down" : null,
      threshold: getNumericSortKey(label),
      yesPrice: getYesPrice(market),
    };
  });

  const chooseDirectional = (
    direction: "up" | "down",
  ): PolymarketMarket | null => {
    const candidates = thresholdMarkets.filter((market) => market.direction === direction);
    if (candidates.length === 0) {
      return null;
    }

    const unresolved = candidates.filter((market) => market.yesPrice < CERTAINTY_THRESHOLD);
    const pool = unresolved.length > 0 ? unresolved : candidates;
    const sorted = [...pool].sort((left, right) => {
      if (left.threshold === null && right.threshold === null) {
        return right.yesPrice - left.yesPrice;
      }

      if (left.threshold === null) return 1;
      if (right.threshold === null) return -1;

      return direction === "up"
        ? left.threshold - right.threshold
        : right.threshold - left.threshold;
    });

    return sorted[0]?.market ?? null;
  };

  const selected = [chooseDirectional("up"), chooseDirectional("down")].filter(
    (market): market is PolymarketMarket => market !== null,
  );

  if (selected.length === 0) {
    return getFallbackSnippetMarkets(markets);
  }

  if (selected.length === 1) {
    const fallback = markets.find((market) => market.id !== selected[0]?.id);
    return fallback ? [selected[0], fallback] : selected;
  }

  return selected;
};

const selectLeadMarkets = (
  event: PolymarketEvent,
  family: CryptoCardFamily,
): PolymarketMarket[] => {
  if (event.markets.length <= 2) {
    return [...event.markets];
  }

  switch (family) {
    case "up-down":
      return [event.markets[0]];
    case "above-below":
      return event.markets.slice(0, 2);
    case "price-range":
      return getPriceRangeMarkets(event.markets);
    case "hit-price":
      return getHitPriceMarkets(event.markets);
    case "other":
      return getFallbackSnippetMarkets(event.markets);
  }
};

const toSnippet = (market: PolymarketMarket): CryptoCardSnippet => ({
  id: `${market.id}:${getMarketLabel(market)}`,
  marketId: market.id,
  label: getMarketLabel(market),
  tokenId: market.clobTokenIds[0] || null,
  fallbackPrice: getYesPrice(market),
  bestBid: market.bestBid,
  bestAsk: market.bestAsk,
  primaryOutcomeLabel: market.outcomes[0] || "Yes",
  secondaryOutcomeLabel: market.outcomes[1] || "No",
});

export const deriveCryptoTimeBucket = (
  event: PolymarketEvent,
): CryptoCardTimeBucket => {
  const tags = getTagSet(event);
  if (tags.has("5m")) return "5m";
  if (tags.has("15m")) return "15m";
  if (tags.has("1h")) return "1h";
  if (tags.has("4h")) return "4h";
  if (tags.has("daily")) return "daily";
  if (tags.has("weekly")) return "weekly";
  if (tags.has("monthly")) return "monthly";
  if (tags.has("yearly")) return "yearly";
  if (tags.has("pre-market")) return "pre-market";
  return "other";
};

export const deriveCryptoFamily = (event: PolymarketEvent): CryptoCardFamily => {
  const tags = getTagSet(event);
  if (tags.has("up-or-down")) return "up-down";
  if (tags.has("multi-strikes")) return "above-below";
  if (tags.has("neg-risk")) return "price-range";
  if (tags.has("hit-price")) return "hit-price";

  const title = normalizeText(event.title);
  if (title.includes("up or down")) return "up-down";
  if (title.includes("what price will") && title.includes(" hit")) return "hit-price";
  if (title.includes(" above ___")) return "above-below";
  if (title.includes(" price on ")) return "price-range";

  return "other";
};

export const deriveCryptoAsset = (event: PolymarketEvent): CryptoCardAsset => {
  const tags = getTagSet(event);
  if (tags.has("bitcoin")) return "bitcoin";
  if (tags.has("ethereum")) return "ethereum";
  if (tags.has("solana")) return "solana";
  if (tags.has("xrp")) return "xrp";
  if (tags.has("dogecoin")) return "dogecoin";
  if (tags.has("bnb")) return "bnb";
  if (tags.has("microstrategy")) return "microstrategy";

  const fallbackSource = `${event.title} ${event.slug}`.toLowerCase();
  if (fallbackSource.includes("bitcoin") || fallbackSource.includes("btc")) return "bitcoin";
  if (fallbackSource.includes("ethereum") || fallbackSource.includes(" eth")) return "ethereum";
  if (fallbackSource.includes("solana") || fallbackSource.includes(" sol")) return "solana";
  if (fallbackSource.includes("xrp")) return "xrp";
  if (fallbackSource.includes("dogecoin") || fallbackSource.includes(" doge")) {
    return "dogecoin";
  }
  if (fallbackSource.includes("bnb") || fallbackSource.includes("binance coin")) {
    return "bnb";
  }
  if (
    fallbackSource.includes("microstrategy") ||
    fallbackSource.includes("micro strategy") ||
    fallbackSource.includes("mstr")
  ) {
    return "microstrategy";
  }

  return "other";
};

const buildCardModel = (event: PolymarketEvent): CryptoCardModel => {
  const family = deriveCryptoFamily(event);
  const leadMarkets = selectLeadMarkets(event, family);
  const snippets = leadMarkets.map(toSnippet);
  const primarySnippet = snippets[0] ?? toSnippet(event.markets[0]);
  const asset = deriveCryptoAsset(event);
  const timeBucket = deriveCryptoTimeBucket(event);

  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    imageSrc: getEventImage(event),
    family,
    timeBucket,
    asset,
    showLiveDot: event.active && !event.closed && timeBucket !== "pre-market",
    volumeLabel: `${formatVolume(event.volume24hr || event.volume)} Vol.`,
    metaLabel: asset !== "other" ? ASSET_LABELS[asset] : null,
    variant: family === "up-down" || snippets.length === 1 ? "single" : "list",
    sortVolume: event.volume24hr || event.volume,
    primarySnippet,
    snippets,
  };
};

const isTradableCryptoEvent = (event: PolymarketEvent): boolean =>
  event.active &&
  !event.closed &&
  !event.archived &&
  event.markets.some((market) => !market.closed && market.acceptingOrders);

const isHotCryptoPrice = (price: number): boolean =>
  price > HOT_CRYPTO_MIN_PRICE && price < HOT_CRYPTO_MAX_PRICE;

const scoreCryptoEventHotness = (event: PolymarketEvent) => {
  const card = buildCardModel(event);
  const price = card.primarySnippet.fallbackPrice;
  const timestamp = getEventTimestamp(event);
  const now = Date.now();

  return {
    card,
    isTradable: isTradableCryptoEvent(event),
    isLive: card.showLiveDot,
    isOpenPrice: isHotCryptoPrice(price),
    timeBucketPriority: CRYPTO_TIME_BUCKET_PRIORITY[card.timeBucket],
    volume: event.volume24hr || event.volume,
    isFuture: timestamp >= now,
    futureDistance: timestamp >= now ? timestamp - now : Number.MAX_SAFE_INTEGER,
  };
};

export const compareCryptoEventsForDisplay = (
  left: PolymarketEvent,
  right: PolymarketEvent,
): number => {
  const leftScore = scoreCryptoEventHotness(left);
  const rightScore = scoreCryptoEventHotness(right);

  return (
    Number(rightScore.isTradable) - Number(leftScore.isTradable) ||
    Number(rightScore.isLive) - Number(leftScore.isLive) ||
    Number(rightScore.isOpenPrice) - Number(leftScore.isOpenPrice) ||
    leftScore.timeBucketPriority - rightScore.timeBucketPriority ||
    rightScore.volume - leftScore.volume ||
    Number(rightScore.isFuture) - Number(leftScore.isFuture) ||
    leftScore.futureDistance - rightScore.futureDistance
  );
};

const matchesFamily = (
  card: CryptoCardModel,
  family: CryptoFamily,
): boolean => family === "all" || card.family === family;

const matchesTime = (
  card: CryptoCardModel,
  time: CryptoTimeBucket,
): boolean => time === "all" || card.timeBucket === time;

const matchesAsset = (
  card: CryptoCardModel,
  asset: CryptoAsset,
): boolean => asset === "all" || card.asset === asset;

const incrementCount = <T extends string>(
  counts: Map<T, number>,
  value: T,
): void => {
  counts.set(value, (counts.get(value) ?? 0) + 1);
};

const buildOptions = <T extends string>(
  order: ReadonlyArray<T>,
  counts: Map<T, number>,
  labels: Record<T, string>,
): CryptoFacetOption<T>[] =>
  order
    .map((value) => ({
      value,
      label: labels[value],
      count: counts.get(value) ?? 0,
    }))
    .filter((option, index) => index === 0 || option.count > 0);

const buildFamilyTabs = (
  cards: ReadonlyArray<CryptoCardModel>,
): CryptoFacetState["familyTabs"] => {
  const familyCounts = new Map<CryptoFamily, number>([["all", cards.length]]);

  cards.forEach((card) => {
    if (card.family !== "other") {
      incrementCount(familyCounts, card.family);
    }
  });

  return buildOptions(FAMILY_ORDER, familyCounts, FAMILY_LABELS);
};

const buildTimeOptions = (
  cards: ReadonlyArray<CryptoCardModel>,
): CryptoFacetRail["timeOptions"] => {
  const timeCounts = new Map<CryptoTimeBucket, number>([["all", cards.length]]);

  cards.forEach((card) => {
    if (card.timeBucket !== "other") {
      incrementCount(timeCounts, card.timeBucket);
    }
  });

  return buildOptions(TIME_ORDER, timeCounts, TIME_LABELS);
};

const buildAssetOptions = (
  cards: ReadonlyArray<CryptoCardModel>,
): CryptoFacetRail["assetOptions"] => {
  const assetCounts = new Map<CryptoAsset, number>([["all", cards.length]]);

  cards.forEach((card) => {
    if (card.asset !== "other") {
      incrementCount(assetCounts, card.asset);
    }
  });

  return buildOptions(ASSET_ORDER, assetCounts, ASSET_LABELS);
};

export const buildCryptoWorkingSet = (
  events: ReadonlyArray<PolymarketEvent>,
): CryptoWorkingSet => {
  const cards = [...events].sort(compareCryptoEventsForDisplay).map(buildCardModel);

  return {
    cards,
  };
};

export const buildCryptoFacetState = (
  cards: ReadonlyArray<CryptoCardModel>,
  filters: CryptoFilterState,
): CryptoFacetState => {
  const familyCards = cards.filter(
    (card) => matchesTime(card, filters.time) && matchesAsset(card, filters.asset),
  );
  const timeCards = cards.filter(
    (card) => matchesFamily(card, filters.family) && matchesAsset(card, filters.asset),
  );
  const assetCards = cards.filter(
    (card) => matchesFamily(card, filters.family) && matchesTime(card, filters.time),
  );

  return {
    familyTabs: buildFamilyTabs(familyCards),
    rail: {
      timeOptions: buildTimeOptions(timeCards),
      assetOptions: buildAssetOptions(assetCards),
    },
  };
};

const FAMILY_SET = new Set(FAMILY_ORDER);
const TIME_SET = new Set(TIME_ORDER);
const ASSET_SET = new Set(ASSET_ORDER);

export const parseCryptoSearchParams = (searchParams: {
  family?: SearchParamValue;
  time?: SearchParamValue;
  asset?: SearchParamValue;
}): CryptoFilterState => {
  const rawFamily = normalizeText(
    asSingleValue(searchParams.family) ?? DEFAULT_CRYPTO_FILTERS.family,
  );
  const rawTime = normalizeText(
    asSingleValue(searchParams.time) ?? DEFAULT_CRYPTO_FILTERS.time,
  );
  const rawAsset = normalizeText(
    asSingleValue(searchParams.asset) ?? DEFAULT_CRYPTO_FILTERS.asset,
  );

  return {
    family: FAMILY_SET.has(rawFamily as CryptoFamily)
      ? (rawFamily as CryptoFamily)
      : DEFAULT_CRYPTO_FILTERS.family,
    time: TIME_SET.has(rawTime as CryptoTimeBucket)
      ? (rawTime as CryptoTimeBucket)
      : DEFAULT_CRYPTO_FILTERS.time,
    asset: ASSET_SET.has(rawAsset as CryptoAsset)
      ? (rawAsset as CryptoAsset)
      : DEFAULT_CRYPTO_FILTERS.asset,
  };
};

export const normalizeCryptoFilters = (
  filters: CryptoFilterState,
  workingSet: CryptoWorkingSet,
): CryptoFilterState =>
  resolveNormalizedFacetState(workingSet.cards, filters).filters;

const resolveNormalizedFacetState = (
  cards: ReadonlyArray<CryptoCardModel>,
  filters: CryptoFilterState,
): {
  filters: CryptoFilterState;
  facets: CryptoFacetState;
} => {
  let nextFilters = { ...filters };

  while (true) {
    const facets = buildCryptoFacetState(cards, nextFilters);

    if (
      nextFilters.family !== "all" &&
      !facets.familyTabs.some((option) => option.value === nextFilters.family)
    ) {
      nextFilters = {
        ...nextFilters,
        family: "all",
      };
      continue;
    }

    if (
      nextFilters.time !== "all" &&
      !facets.rail.timeOptions.some((option) => option.value === nextFilters.time)
    ) {
      nextFilters = {
        ...nextFilters,
        time: "all",
      };
      continue;
    }

    if (
      nextFilters.asset !== "all" &&
      !facets.rail.assetOptions.some((option) => option.value === nextFilters.asset)
    ) {
      nextFilters = {
        ...nextFilters,
        asset: "all",
      };
      continue;
    }

    return {
      filters: nextFilters,
      facets,
    };
  }
};

export const filterCryptoCards = (
  cards: ReadonlyArray<CryptoCardModel>,
  filters: CryptoFilterState,
): CryptoCardModel[] =>
  cards.filter(
    (card) =>
      matchesFamily(card, filters.family) &&
      matchesTime(card, filters.time) &&
      matchesAsset(card, filters.asset),
  );

export const buildCryptoHydrationSeeds = (
  cards: ReadonlyArray<CryptoCardModel>,
  {
    cardLimit,
  }: {
    cardLimit?: number;
  } = {},
): PriceHydrationSeed[] => {
  const seeds = new Map<string, PriceHydrationSeed>();
  const cardsToSeed =
    typeof cardLimit === "number" && cardLimit > 0 ? cards.slice(0, cardLimit) : cards;

  cardsToSeed.forEach((card) => {
    card.snippets.forEach((snippet) => {
      if (!snippet.tokenId || seeds.has(snippet.tokenId)) {
        return;
      }

      seeds.set(snippet.tokenId, {
        tokenId: snippet.tokenId,
        price: snippet.fallbackPrice,
        bestBid: snippet.bestBid,
        bestAsk: snippet.bestAsk,
      });
    });
  });

  return [...seeds.values()];
};

export const resolveCryptoSurfaceState = (
  workingSet: CryptoWorkingSet,
  filters: CryptoFilterState,
): CryptoResolvedSurfaceState => {
  const {
    filters: normalizedFilters,
    facets,
  } = resolveNormalizedFacetState(workingSet.cards, filters);
  const cards = filterCryptoCards(workingSet.cards, normalizedFilters);

  return {
    filters: normalizedFilters,
    facets,
    cards,
    hydrationSeeds: buildCryptoHydrationSeeds(cards),
  };
};

export const getCryptoFilterHref = (
  filters: CryptoFilterState,
  patch: Partial<CryptoFilterState>,
): string => {
  const next: CryptoFilterState = {
    ...filters,
    ...patch,
  };
  const params = new URLSearchParams();

  if (next.family !== "all") {
    params.set("family", next.family);
  }

  if (next.time !== "all") {
    params.set("time", next.time);
  }

  if (next.asset !== "all") {
    params.set("asset", next.asset);
  }

  const query = params.toString();
  return query ? `/crypto?${query}` : "/crypto";
};
