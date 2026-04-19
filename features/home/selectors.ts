import type {
  PolymarketEvent,
  PolymarketMarket,
  PolymarketTag,
} from "@/features/events/types";
import { getVisibleTags, hasTagSlug } from "@/shared/lib/tags";

export type BreakingItem = {
  event: PolymarketEvent;
  market: PolymarketMarket;
  currentPrice: number;
  change: number;
};

export type TopicSummary = {
  slug: string;
  label: string;
  totalVolume: number;
  eventCount: number;
};

const GENERIC_TOPIC_SLUGS = new Set([
  "featured",
  "games",
  "sports",
  "crypto",
  "politics",
  "world-elections",
  "global-elections",
  "recurring",
  "crypto-prices",
  "hide-from-new",
  "multi-strikes",
  "today",
  "daily-close",
]);

const getRankedEvents = (
  events: ReadonlyArray<PolymarketEvent>,
): PolymarketEvent[] =>
  [...events].sort(
    (left, right) =>
      Number(right.featured) - Number(left.featured) ||
      right.volume24hr - left.volume24hr ||
      right.volume - left.volume,
  );

export const getPrimaryMarket = (
  event: PolymarketEvent,
): PolymarketMarket | undefined =>
  [...event.markets].sort(
    (left, right) =>
      Math.abs(right.oneDayPriceChange) - Math.abs(left.oneDayPriceChange) ||
      right.volumeNum - left.volumeNum,
  )[0];

export const selectFeaturedEvents = (
  events: ReadonlyArray<PolymarketEvent>,
  limit = 5,
): PolymarketEvent[] => {
  const ranked = getRankedEvents(events);
  const selected: PolymarketEvent[] = [];
  const selectedIds = new Set<string>();

  const pushMatch = (predicate: (event: PolymarketEvent) => boolean) => {
    const match = ranked.find(
      (event) => !selectedIds.has(event.id) && predicate(event),
    );

    if (!match) return;
    selected.push(match);
    selectedIds.add(match.id);
  };

  pushMatch(
    (event) =>
      event.featured && !hasTagSlug(event, "sports") && !hasTagSlug(event, "crypto"),
  );
  pushMatch(
    (event) =>
      hasTagSlug(event, "sports") &&
      (hasTagSlug(event, "games") || / vs\.? /i.test(event.title)),
  );
  pushMatch((event) => hasTagSlug(event, "crypto"));
  pushMatch((event) => hasTagSlug(event, "politics"));
  pushMatch((event) => event.showAllOutcomes && event.markets.length > 1);

  for (const event of ranked) {
    if (selected.length >= limit) break;
    if (selectedIds.has(event.id)) continue;
    selected.push(event);
    selectedIds.add(event.id);
  }

  return selected.slice(0, limit);
};

export const selectBreakingItems = (
  events: ReadonlyArray<PolymarketEvent>,
  limit = 4,
): BreakingItem[] => {
  const selected: BreakingItem[] = [];
  const seenEventIds = new Set<string>();

  const rankedMarkets = events
    .flatMap((event) =>
      event.markets.map((market) => ({
        event,
        market,
        change: Number.isFinite(market.oneDayPriceChange)
          ? market.oneDayPriceChange
          : 0,
        currentPrice:
          market.lastTradePrice || market.outcomePrices[0] || market.bestBid || 0,
      })),
    )
    .sort(
      (left, right) =>
        Math.abs(right.change) - Math.abs(left.change) ||
        right.market.volumeNum - left.market.volumeNum ||
        right.event.volume24hr - left.event.volume24hr,
    );

  for (const item of rankedMarkets) {
    if (selected.length >= limit) break;
    if (seenEventIds.has(item.event.id)) continue;
    seenEventIds.add(item.event.id);
    selected.push(item);
  }

  return selected;
};

const canSurfaceTopic = (tag: PolymarketTag): boolean =>
  tag.slug.length > 0 &&
  tag.label.length > 0 &&
  !GENERIC_TOPIC_SLUGS.has(tag.slug) &&
  !tag.forceHide;

export const collectTrendingTopics = (
  events: ReadonlyArray<PolymarketEvent>,
  limit = 10,
): TopicSummary[] => {
  const topicMap = new Map<string, TopicSummary>();

  for (const event of events) {
    for (const tag of getVisibleTags(event)) {
      if (!canSurfaceTopic(tag)) continue;

      const existing = topicMap.get(tag.slug);
      if (existing) {
        existing.totalVolume += event.volume24hr || event.volume;
        existing.eventCount += 1;
        continue;
      }

      topicMap.set(tag.slug, {
        slug: tag.slug,
        label: tag.label,
        totalVolume: event.volume24hr || event.volume,
        eventCount: 1,
      });
    }
  }

  return [...topicMap.values()]
    .sort(
      (left, right) =>
        right.totalVolume - left.totalVolume ||
        right.eventCount - left.eventCount ||
        left.label.localeCompare(right.label),
    )
    .slice(0, limit);
};
