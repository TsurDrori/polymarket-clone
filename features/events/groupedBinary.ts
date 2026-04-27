import type { PolymarketEvent, PolymarketMarket } from "@/features/events/types";

const hasBinaryOutcomePair = (market: PolymarketMarket): boolean =>
  market.outcomes.length >= 2 && market.clobTokenIds.length >= 2;

const hasQuestionCopy = (market: PolymarketMarket): boolean =>
  market.question.trim().length > 0;

const hasGroupedMarketMetadata = (market: PolymarketMarket): boolean =>
  market.marketGroup !== undefined ||
  Boolean(market.groupItemTitle?.trim() || market.groupItemThreshold?.trim());

export const isGroupedBinaryMarket = (
  market: PolymarketMarket,
  { includeClosed = true }: { includeClosed?: boolean } = {},
): boolean => {
  if (!includeClosed && market.closed) {
    return false;
  }

  return hasQuestionCopy(market) && hasBinaryOutcomePair(market);
};

export const getGroupedBinaryMarkets = (
  event: PolymarketEvent,
  { includeClosed = true }: { includeClosed?: boolean } = {},
): PolymarketMarket[] => {
  const markets = event.markets.filter((market) =>
    isGroupedBinaryMarket(market, { includeClosed }),
  );

  return markets.length > 0 || includeClosed
    ? markets
    : event.markets.filter((market) => isGroupedBinaryMarket(market));
};

export const selectGroupedBinaryPreviewMarkets = (
  markets: PolymarketMarket[],
  limit: number,
): PolymarketMarket[] => {
  if (markets.length <= limit) {
    return markets;
  }

  const openMarkets = markets.filter((market) => !market.closed);

  if (openMarkets.length >= limit) {
    return openMarkets.slice(0, limit);
  }

  if (openMarkets.length === 0) {
    return markets.slice(0, limit);
  }

  const selected = new Map<string, PolymarketMarket>();
  for (const market of markets) {
    if (selected.size >= limit - openMarkets.length) {
      break;
    }
    selected.set(market.id, market);
  }
  for (const market of openMarkets) {
    selected.set(market.id, market);
  }

  return [...selected.values()].slice(0, limit);
};

export const shouldRenderGroupedBinaryCard = (
  event: PolymarketEvent,
  { includeClosed = true }: { includeClosed?: boolean } = {},
): boolean => {
  const groupedMarkets = getGroupedBinaryMarkets(event, { includeClosed });
  const hasGroupedBinaryShape =
    groupedMarkets.length > 1 &&
    (event.showAllOutcomes || groupedMarkets.some(hasGroupedMarketMetadata));
  const marketStructure =
    event.marketStructure ?? (hasGroupedBinaryShape ? "grouped-binary" : "single-binary");

  if (marketStructure !== "grouped-binary") {
    return false;
  }

  return groupedMarkets.length > 1;
};
