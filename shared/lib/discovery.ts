import type { PolymarketEvent, PolymarketMarket } from "@/features/events/types";

const RESOLVED_PRICE_MIN = 0.03;
const RESOLVED_PRICE_MAX = 0.97;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_WEEK_MS = 7 * ONE_DAY_MS;
const ONE_MONTH_MS = 30 * ONE_DAY_MS;

const clampPrice = (value: number): number => Math.max(0, Math.min(1, value));

const getMarketDisplayPrice = (market: PolymarketMarket): number =>
  clampPrice(market.lastTradePrice || market.outcomePrices[0] || market.bestBid || 0);

const getMarketVolume = (market: PolymarketMarket): number =>
  market.volume24hr > 0 ? market.volume24hr : market.volumeNum;

const getMarketTokenCount = (market: PolymarketMarket): number =>
  market.clobTokenIds.filter(Boolean).length;

const getEventEndTimestamp = (
  event: PolymarketEvent,
  market?: PolymarketMarket,
): number | null => {
  const candidate = event.endDate ?? market?.endDate;
  if (!candidate) {
    return null;
  }

  const parsed = Date.parse(candidate);
  return Number.isFinite(parsed) ? parsed : null;
};

export const selectPrimaryDiscoveryMarket = (
  event: PolymarketEvent,
): PolymarketMarket | undefined =>
  [...event.markets].sort((left, right) => {
    const leftTradable = Number(left.acceptingOrders && !left.closed);
    const rightTradable = Number(right.acceptingOrders && !right.closed);

    return (
      rightTradable - leftTradable ||
      getMarketTokenCount(right) - getMarketTokenCount(left) ||
      getMarketVolume(right) - getMarketVolume(left) ||
      Math.abs(right.oneDayPriceChange) - Math.abs(left.oneDayPriceChange) ||
      left.question.localeCompare(right.question)
    );
  })[0];

export type EventDiscoverySignal = {
  market?: PolymarketMarket;
  endTimestamp: number | null;
  isPast: boolean;
  isTradable: boolean;
  isOpenPrice: boolean;
  recencyBucket: number;
  priceMovement: number;
  volume: number;
};

export const getEventDiscoverySignal = (
  event: PolymarketEvent,
  market = selectPrimaryDiscoveryMarket(event),
): EventDiscoverySignal => {
  const now = Date.now();
  const endTimestamp = getEventEndTimestamp(event, market);
  const timeToEnd = endTimestamp === null ? null : endTimestamp - now;
  const isPast =
    event.closed ||
    event.archived ||
    event.ended === true ||
    (timeToEnd !== null && timeToEnd < 0);
  const isTradable =
    market !== undefined &&
    event.active &&
    !event.closed &&
    !event.archived &&
    event.ended !== true &&
    market.acceptingOrders &&
    !market.closed &&
    getMarketTokenCount(market) > 0;
  const price = market ? getMarketDisplayPrice(market) : 0;
  const isOpenPrice = price > RESOLVED_PRICE_MIN && price < RESOLVED_PRICE_MAX;

  let recencyBucket = 1;
  if (timeToEnd !== null) {
    if (timeToEnd < 0) {
      recencyBucket = -2;
    } else if (timeToEnd <= ONE_DAY_MS) {
      recencyBucket = 4;
    } else if (timeToEnd <= ONE_WEEK_MS) {
      recencyBucket = 3;
    } else if (timeToEnd <= ONE_MONTH_MS) {
      recencyBucket = 2;
    } else {
      recencyBucket = 0;
    }
  }

  return {
    market,
    endTimestamp,
    isPast,
    isTradable,
    isOpenPrice,
    recencyBucket,
    priceMovement: market ? Math.abs(market.oneDayPriceChange) : 0,
    volume: event.volume24hr > 0 ? event.volume24hr : event.volume,
  };
};

export const compareEventsForDiscovery = (
  left: PolymarketEvent,
  right: PolymarketEvent,
): number => {
  const leftSignal = getEventDiscoverySignal(left);
  const rightSignal = getEventDiscoverySignal(right);

  return (
    Number(rightSignal.isTradable) - Number(leftSignal.isTradable) ||
    Number(rightSignal.isOpenPrice) - Number(leftSignal.isOpenPrice) ||
    rightSignal.recencyBucket - leftSignal.recencyBucket ||
    rightSignal.priceMovement - leftSignal.priceMovement ||
    rightSignal.volume - leftSignal.volume ||
    Number(rightSignal.isPast) - Number(leftSignal.isPast) ||
    left.title.localeCompare(right.title)
  );
};

export const isEventHotDiscoveryCandidate = (event: PolymarketEvent): boolean => {
  const signal = getEventDiscoverySignal(event);

  return signal.isTradable && signal.isOpenPrice && !signal.isPast;
};
