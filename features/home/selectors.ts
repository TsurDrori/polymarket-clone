import type {
  PolymarketEvent,
  PolymarketMarket,
  PolymarketTag,
} from "@/features/events/types";
import { formatEndDate, formatVolume } from "@/shared/lib/format";
import { getVisibleTags, hasTagSlug } from "@/shared/lib/tags";

export type HeroChartPoint = {
  t: number;
  p: number;
};

export type HeroChartModel = {
  points: HeroChartPoint[];
  intervalLabel: string;
  sourceLabel: string;
};

export type HeroSourceRow = {
  label: string;
  value: string;
};

export type HeroChip = {
  slug: string;
  label: string;
  href?: string;
};

export type HeroBreakingItem = {
  event: PolymarketEvent;
  market: PolymarketMarket;
  chance: number;
  dayChange: number;
  label: string;
  href: string;
};

export type TopicSummary = {
  slug: string;
  label: string;
  totalVolume: number;
  eventCount: number;
};

export type HeroTopicItem = TopicSummary & {
  href?: string;
};

export type HeroSpotlightModel = {
  event: PolymarketEvent;
  market: PolymarketMarket;
  tokenId?: string;
  chart: HeroChartModel | null;
  headline: string;
  summary: string;
  categoryLabel: string;
  subcategoryLabel?: string;
  chance: number;
  dayChange: number;
  volumeLabel: string;
  notes: string[];
  sourceRows: HeroSourceRow[];
  sourceMode: "fallback-derived";
  href: string;
};

export type HomeHeroModel = {
  spotlight: HeroSpotlightModel | null;
  breaking: HeroBreakingItem[];
  topics: HeroTopicItem[];
  contextChips: HeroChip[];
};

export type HomePageModel = {
  hero: HomeHeroModel;
  exploreEvents: PolymarketEvent[];
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

const CATEGORY_ROUTES = new Map<string, string>([
  ["politics", "/politics"],
  ["sports", "/sports/live"],
  ["crypto", "/crypto"],
]);

const PRIMARY_CATEGORY_SLUGS = new Set([
  "politics",
  "sports",
  "crypto",
  "economy",
  "middle-east",
  "world",
  "tech",
  "culture",
  "business",
]);

const normalizeText = (value: string): string =>
  value.replace(/\s+/g, " ").trim();

const compareNumbersDesc = (left: number, right: number): number => right - left;

const getEventHref = (event: PolymarketEvent): string => `/event/${event.slug}`;

const getDisplayPrice = (market: PolymarketMarket): number =>
  market.lastTradePrice || market.outcomePrices[0] || market.bestBid || 0;

const getMarketVolume = (market: PolymarketMarket): number =>
  market.volume24hr || market.volumeNum;

const getMarketChange = (market: PolymarketMarket): number =>
  Number.isFinite(market.oneDayPriceChange) ? market.oneDayPriceChange : 0;

const getPrimaryVisibleTags = (event: PolymarketEvent): PolymarketTag[] =>
  getVisibleTags(event).filter((tag) => tag.label.length > 0);

const isSportsEvent = (event: PolymarketEvent): boolean =>
  hasTagSlug(event, "sports") || Boolean(event.eventMetadata?.league);

const isMarketEligibleForSpotlight = (market: PolymarketMarket): boolean =>
  Boolean(market.clobTokenIds[0]) && !market.closed;

const getRankedEvents = (
  events: ReadonlyArray<PolymarketEvent>,
): PolymarketEvent[] =>
  [...events].sort(
    (left, right) =>
      Number(right.featured) - Number(left.featured) ||
      compareNumbersDesc(
        Number(!isSportsEvent(left)),
        Number(!isSportsEvent(right)),
      ) ||
      compareNumbersDesc(left.volume24hr || left.volume, right.volume24hr || right.volume) ||
      compareNumbersDesc(left.volume, right.volume),
  );

const rankSpotlightEvent = (event: PolymarketEvent) => {
  const market = selectSpotlightMarket(event);
  if (!market) return null;

  return {
    featured: Number(event.featured),
    nonSports: Number(!isSportsEvent(event)),
    hasDescription: Number(Boolean(event.description?.trim())),
    eventVolume: event.volume24hr || event.volume,
    marketVolume: getMarketVolume(market),
    marketChange: Math.abs(getMarketChange(market)),
  };
};

const buildDescriptionSentences = (event: PolymarketEvent): string[] =>
  normalizeText(event.description ?? "")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => normalizeText(sentence))
    .filter((sentence) => sentence.length >= 24);

const buildFallbackSourceRows = (
  event: PolymarketEvent,
  market: PolymarketMarket,
): HeroSourceRow[] => {
  const sourceRows: HeroSourceRow[] = [];
  const seen = new Set<string>();
  const descriptionSentences = buildDescriptionSentences(event);

  const pushRow = (label: string, value: string | undefined) => {
    const normalized = normalizeText(value ?? "");
    if (normalized.length === 0) return;
    const dedupeKey = normalized.toLowerCase();
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);
    sourceRows.push({ label, value: normalized });
  };

  pushRow("Market brief", descriptionSentences[0]);
  pushRow("Resolution rule", descriptionSentences[1]);

  if (event.endDate) {
    pushRow("Timeline", `Resolves by ${formatEndDate(event.endDate)}.`);
  }

  pushRow("Contract", market.question);
  pushRow("Event focus", event.title);

  return sourceRows.slice(0, 3);
};

const buildSpotlightNotes = (
  event: PolymarketEvent,
  market: PolymarketMarket,
): string[] => {
  const notes: string[] = [];
  const dayChange = getMarketChange(market);

  notes.push(
    dayChange === 0
      ? "Flat over the last day."
      : `${dayChange > 0 ? "Up" : "Down"} ${Math.round(Math.abs(dayChange) * 100)} pts over 24h.`,
  );
  notes.push(`${formatVolume(getMarketVolume(market) || event.volume24hr || event.volume)} tracked volume.`);

  if (event.endDate) {
    notes.push(`Resolution date: ${formatEndDate(event.endDate)}.`);
  }

  return notes.slice(0, 3);
};

const canSurfaceTopic = (tag: PolymarketTag): boolean =>
  tag.slug.length > 0 &&
  tag.label.length > 0 &&
  !GENERIC_TOPIC_SLUGS.has(tag.slug) &&
  !tag.forceHide;

const buildSpotlightLabels = (
  event: PolymarketEvent,
): Pick<HeroSpotlightModel, "categoryLabel" | "subcategoryLabel"> => {
  const tags = getPrimaryVisibleTags(event);
  const category =
    tags.find((tag) => PRIMARY_CATEGORY_SLUGS.has(tag.slug)) ?? tags[0];
  const subcategory = tags.find(
    (tag) => tag.slug !== category?.slug && canSurfaceTopic(tag),
  );

  return {
    categoryLabel: category?.label ?? "Trending",
    subcategoryLabel: subcategory?.label,
  };
};

const buildSpotlightHeadline = (
  event: PolymarketEvent,
  market: PolymarketMarket,
): string => {
  const [firstSentence] = buildDescriptionSentences(event);
  if (firstSentence) {
    return firstSentence;
  }

  return market.question || event.title;
};

const buildSpotlightSummary = (
  event: PolymarketEvent,
  market: PolymarketMarket,
): string => {
  const descriptionSentences = buildDescriptionSentences(event);
  const summary = descriptionSentences.find(
    (sentence) => sentence !== buildSpotlightHeadline(event, market),
  );

  return summary ?? "Derived from the market description because the public API does not expose live article rows.";
};

const buildHeroChipHref = (slug: string): string | undefined =>
  CATEGORY_ROUTES.get(slug);

const buildTopicItems = (
  events: ReadonlyArray<PolymarketEvent>,
  limit = 5,
): HeroTopicItem[] =>
  collectTrendingTopics(events, limit).map((topic) => ({
    ...topic,
    href: buildHeroChipHref(topic.slug),
  }));

export const selectSpotlightMarket = (
  event: PolymarketEvent,
): PolymarketMarket | undefined => {
  const eligibleMarkets = event.markets.filter(isMarketEligibleForSpotlight);
  const fallbackMarkets = eligibleMarkets.length > 0 ? eligibleMarkets : event.markets;

  return [...fallbackMarkets].sort(
    (left, right) =>
      Number(right.acceptingOrders) - Number(left.acceptingOrders) ||
      compareNumbersDesc(
        Number(Boolean(right.clobTokenIds[0])),
        Number(Boolean(left.clobTokenIds[0])),
      ) ||
      compareNumbersDesc(
        Math.abs(getMarketChange(left)),
        Math.abs(getMarketChange(right)),
      ) ||
      compareNumbersDesc(getMarketVolume(left), getMarketVolume(right)) ||
      left.question.localeCompare(right.question),
  )[0];
};

export const getPrimaryMarket = (
  event: PolymarketEvent,
): PolymarketMarket | undefined => selectSpotlightMarket(event);

export const selectSpotlightEvent = (
  events: ReadonlyArray<PolymarketEvent>,
): PolymarketEvent | undefined =>
  [...events]
    .filter((event) => Boolean(selectSpotlightMarket(event)))
    .sort((left, right) => {
      const leftRank = rankSpotlightEvent(left);
      const rightRank = rankSpotlightEvent(right);

      if (!leftRank || !rightRank) return 0;

      return (
        rightRank.featured - leftRank.featured ||
        rightRank.nonSports - leftRank.nonSports ||
        compareNumbersDesc(leftRank.hasDescription, rightRank.hasDescription) ||
        compareNumbersDesc(leftRank.eventVolume, rightRank.eventVolume) ||
        compareNumbersDesc(leftRank.marketChange, rightRank.marketChange) ||
        compareNumbersDesc(leftRank.marketVolume, rightRank.marketVolume)
      );
    })[0];

export const selectFeaturedEvents = (
  events: ReadonlyArray<PolymarketEvent>,
  limit = 5,
): PolymarketEvent[] => getRankedEvents(events).slice(0, limit);

export const selectHeroBreaking = (
  events: ReadonlyArray<PolymarketEvent>,
  {
    excludeEventId,
    limit = 3,
  }: {
    excludeEventId?: string;
    limit?: number;
  } = {},
): HeroBreakingItem[] => {
  const selected: HeroBreakingItem[] = [];
  const seenEventIds = new Set<string>();

  const rankedMarkets = events
    .flatMap((event) =>
      event.markets
        .filter(isMarketEligibleForSpotlight)
        .map((market) => ({
          event,
          market,
          chance: getDisplayPrice(market),
          dayChange: getMarketChange(market),
          label: market.groupItemTitle || market.question,
          href: getEventHref(event),
        })),
    )
    .sort(
      (left, right) =>
        compareNumbersDesc(
          Math.abs(left.dayChange),
          Math.abs(right.dayChange),
        ) ||
        compareNumbersDesc(
          getMarketVolume(left.market),
          getMarketVolume(right.market),
        ) ||
        compareNumbersDesc(left.event.volume24hr, right.event.volume24hr),
    );

  for (const item of rankedMarkets) {
    if (selected.length >= limit) break;
    if (item.event.id === excludeEventId) continue;
    if (seenEventIds.has(item.event.id)) continue;
    seenEventIds.add(item.event.id);
    selected.push(item);
  }

  return selected;
};

export const selectBreakingItems = (
  events: ReadonlyArray<PolymarketEvent>,
  limit = 4,
): HeroBreakingItem[] => selectHeroBreaking(events, { limit });

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
        compareNumbersDesc(left.totalVolume, right.totalVolume) ||
        compareNumbersDesc(left.eventCount, right.eventCount) ||
        left.label.localeCompare(right.label),
    )
    .slice(0, limit);
};

export const selectHeroTopics = (
  events: ReadonlyArray<PolymarketEvent>,
  limit = 5,
): HeroTopicItem[] => buildTopicItems(events, limit);

export const selectHeroContextChips = (
  spotlight: HeroSpotlightModel | null,
  topics: ReadonlyArray<HeroTopicItem>,
  limit = 8,
): HeroChip[] => {
  const chips: HeroChip[] = [];
  const seen = new Set<string>();

  const pushChip = (chip: HeroChip | null) => {
    if (!chip) return;
    const dedupeKey = chip.slug || chip.label.toLowerCase();
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);
    chips.push(chip);
  };

  pushChip({ slug: "all", label: "All", href: "#all-markets" });

  if (spotlight) {
    const spotlightTags = getPrimaryVisibleTags(spotlight.event);

    for (const tag of spotlightTags) {
      pushChip({
        slug: tag.slug,
        label: tag.label,
        href: buildHeroChipHref(tag.slug),
      });
    }
  }

  for (const topic of topics) {
    pushChip({
      slug: topic.slug,
      label: topic.label,
      href: topic.href,
    });
  }

  return chips.slice(0, limit);
};

export const buildHomeHeroModel = (
  events: ReadonlyArray<PolymarketEvent>,
  {
    spotlightChart = null,
    breakingLimit = 3,
    topicLimit = 5,
    contextChipLimit = 8,
  }: {
    spotlightChart?: HeroChartModel | null;
    breakingLimit?: number;
    topicLimit?: number;
    contextChipLimit?: number;
  } = {},
): HomeHeroModel => {
  const spotlightEvent = selectSpotlightEvent(events) ?? null;
  const spotlightMarket =
    spotlightEvent ? selectSpotlightMarket(spotlightEvent) ?? null : null;
  const topics = selectHeroTopics(events, topicLimit);

  const spotlight =
    spotlightEvent && spotlightMarket
      ? ({
          event: spotlightEvent,
          market: spotlightMarket,
          tokenId: spotlightMarket.clobTokenIds[0],
          chart:
            spotlightChart && spotlightChart.points.length >= 5
              ? spotlightChart
              : null,
          headline: buildSpotlightHeadline(spotlightEvent, spotlightMarket),
          summary: buildSpotlightSummary(spotlightEvent, spotlightMarket),
          ...buildSpotlightLabels(spotlightEvent),
          chance: getDisplayPrice(spotlightMarket),
          dayChange: getMarketChange(spotlightMarket),
          volumeLabel: formatVolume(
            getMarketVolume(spotlightMarket) ||
              spotlightEvent.volume24hr ||
              spotlightEvent.volume,
          ),
          notes: buildSpotlightNotes(spotlightEvent, spotlightMarket),
          sourceRows: buildFallbackSourceRows(spotlightEvent, spotlightMarket),
          sourceMode: "fallback-derived" as const,
          href: getEventHref(spotlightEvent),
        })
      : null;

  return {
    spotlight,
    breaking: selectHeroBreaking(events, {
      excludeEventId: spotlight?.event.id,
      limit: breakingLimit,
    }),
    topics,
    contextChips: selectHeroContextChips(spotlight, topics, contextChipLimit),
  };
};

export const buildHomePageModel = (
  events: ReadonlyArray<PolymarketEvent>,
  {
    spotlightChart = null,
    exploreLimit = 30,
  }: {
    spotlightChart?: HeroChartModel | null;
    exploreLimit?: number;
  } = {},
): HomePageModel => ({
  hero: buildHomeHeroModel(events, { spotlightChart }),
  exploreEvents: events.slice(0, exploreLimit),
});
