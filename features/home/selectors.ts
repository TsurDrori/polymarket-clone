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
  meta?: string;
  stat?: string;
  statTone?: "up" | "down" | "neutral";
};

export type HeroChip = {
  slug: string;
  label: string;
  href?: string;
};

export type HeroPulseItem = {
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

export type HeroOutcomeItem = {
  marketId: string;
  label: string;
  chance: number;
  href: string;
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
  outcomeItems: HeroOutcomeItem[];
  outcomeMode: "binary" | "multi-market";
  href: string;
  navigationLabel: string;
};

export type HomeHeroModel = {
  spotlights: HeroSpotlightModel[];
  spotlight: HeroSpotlightModel | null;
  pulse: HeroPulseItem[];
  topics: HeroTopicItem[];
  contextChips: HeroChip[];
};

export type HomePageModel = {
  hero: HomeHeroModel;
  marketChips: HeroChip[];
  exploreEvents: PolymarketEvent[];
};

const HOME_HERO_SPOTLIGHT_LIMIT = 6;
export const HOME_EXPLORE_EVENT_LIMIT = 40;

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

const WORLD_CATEGORY_SLUGS = new Set([
  "world",
  "geopolitics",
  "middle-east",
  "foreign-policy",
]);

const POLITICS_CATEGORY_SLUGS = new Set([
  "politics",
  "us-government",
  "congress",
  "house",
  "senate",
  "government",
  "elections",
]);

const MARKET_CHIP_EXCLUDED_SLUGS = new Set([
  "featured",
  "games",
  "world-elections",
  "global-elections",
  "recurring",
  "crypto-prices",
  "hide-from-new",
  "multi-strikes",
  "today",
  "daily-close",
]);

const normalizeText = (value: string): string =>
  value.replace(/\s+/g, " ").trim();

const clampText = (value: string, maxLength: number): string =>
  value.length <= maxLength ? value : `${value.slice(0, maxLength - 1).trimEnd()}…`;

const compareNumbersDesc = (left: number, right: number): number => right - left;

const getEventHref = (event: PolymarketEvent): string => `/event/${event.slug}`;

const getDisplayPrice = (market: PolymarketMarket): number =>
  market.lastTradePrice || market.outcomePrices[0] || market.bestBid || 0;

const getMarketVolume = (market: PolymarketMarket): number =>
  market.volume24hr || market.volumeNum;

const getMarketChange = (market: PolymarketMarket): number =>
  Number.isFinite(market.oneDayPriceChange) ? market.oneDayPriceChange : 0;

const formatRelativeAge = (value?: string): string | undefined => {
  if (!value) return undefined;

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return undefined;

  const elapsedHours = Math.max(
    1,
    Math.round((Date.now() - timestamp) / (1000 * 60 * 60)),
  );

  if (elapsedHours < 24) {
    return `${elapsedHours}h ago`;
  }

  const elapsedDays = Math.round(elapsedHours / 24);
  return `${elapsedDays}d ago`;
};

const NEWSFEED_SOURCE_LABELS = [
  "WSJ",
  "CNN",
  "AP News",
  "The New York Times",
  "BBC",
] as const;

const FALLBACK_SOURCE_STATS = [
  { stat: "+ $100", statTone: "down" as const },
  { stat: "+ $505", statTone: "down" as const },
  { stat: "+ $247", statTone: "down" as const },
  { stat: "+ $11", statTone: "up" as const },
  { stat: "+ $600", statTone: "up" as const },
] as const;

const GENERIC_NAVIGATION_LABELS = new Set([
  "all",
  "featured",
  "market",
  "markets",
  "trending",
]);

const isUsefulNavigationLabel = (value?: string): value is string => {
  if (!value) return false;

  const normalized = normalizeText(value).replace(/[?!.]+$/g, "");
  if (normalized.length < 3) return false;
  if (/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\b/i.test(normalized) && /\d/.test(normalized)) {
    return false;
  }
  if (normalized === normalized.toLowerCase() && !/\d/.test(normalized)) {
    return false;
  }

  return !GENERIC_NAVIGATION_LABELS.has(normalized.toLowerCase());
};

const formatNavigationLabel = (value: string): string =>
  clampText(
    normalizeText(value)
      .replace(/^will\s+/i, "")
      .replace(/[?!.]+$/g, ""),
    18,
  );

const getPrimaryVisibleTags = (event: PolymarketEvent): PolymarketTag[] =>
  getVisibleTags(event).filter((tag) => tag.label.length > 0);

const isSportsEvent = (event: PolymarketEvent): boolean =>
  hasTagSlug(event, "sports") || Boolean(event.eventMetadata?.league);

const isMarketEligibleForSpotlight = (market: PolymarketMarket): boolean =>
  Boolean(market.clobTokenIds[0]) && !market.closed;

const isBalancedSpotlightMarket = (market: PolymarketMarket): boolean => {
  const price = getDisplayPrice(market);
  return price >= 0.14 && price <= 0.86;
};

const getSpotlightProbabilityScore = (market: PolymarketMarket): number => {
  const price = getDisplayPrice(market);
  return 1 - Math.min(1, Math.abs(price - 0.5) * 2);
};

const getQuestionCompactnessScore = (market: PolymarketMarket): number => {
  const length = normalizeText(market.question).length;
  const idealLength = 56;
  return 1 - Math.min(1, Math.abs(length - idealLength) / idealLength);
};

const getEventCategoryKey = (event: PolymarketEvent): string => {
  if (isSportsEvent(event)) return "sports";
  if (hasTagSlug(event, "crypto")) return "crypto";
  if (event.tags.some((tag) => WORLD_CATEGORY_SLUGS.has(tag.slug))) return "world";
  if (hasTagSlug(event, "finance") || hasTagSlug(event, "economy")) return "economy";
  if (hasTagSlug(event, "culture") || hasTagSlug(event, "pop-culture")) return "culture";
  if (hasTagSlug(event, "tech")) return "tech";
  return "politics";
};

const isWorldEvent = (event: PolymarketEvent): boolean =>
  getVisibleTags(event).some((tag) => WORLD_CATEGORY_SLUGS.has(tag.slug));

const getPrimaryLeadTagSlug = (event: PolymarketEvent): string | undefined =>
  getVisibleTags(event)[0]?.slug;

const isDirectWorldLeadEvent = (event: PolymarketEvent): boolean => {
  const primarySlug = getPrimaryLeadTagSlug(event);
  return Boolean(primarySlug && WORLD_CATEGORY_SLUGS.has(primarySlug));
};

const isPoliticsLeadEvent = (event: PolymarketEvent): boolean =>
  getVisibleTags(event).some((tag) => POLITICS_CATEGORY_SLUGS.has(tag.slug)) &&
  !isWorldEvent(event) &&
  !isSportsEvent(event) &&
  !hasTagSlug(event, "crypto");

const isDirectPoliticsLeadEvent = (event: PolymarketEvent): boolean =>
  Boolean(
    getPrimaryLeadTagSlug(event) &&
    POLITICS_CATEGORY_SLUGS.has(getPrimaryLeadTagSlug(event) ?? ""),
  );

const isDirectCryptoLeadEvent = (event: PolymarketEvent): boolean =>
  getPrimaryLeadTagSlug(event) === "crypto";

const isDirectSportsLeadEvent = (event: PolymarketEvent): boolean =>
  getPrimaryLeadTagSlug(event) === "sports" || Boolean(event.eventMetadata?.league);

const getHomeFeedRankedEvents = (
  events: ReadonlyArray<PolymarketEvent>,
): PolymarketEvent[] =>
  [...events].sort((left, right) => {
    const leftMarket = selectSpotlightMarket(left);
    const rightMarket = selectSpotlightMarket(right);
    const leftCentered = leftMarket ? getSpotlightProbabilityScore(leftMarket) : 0;
    const rightCentered = rightMarket ? getSpotlightProbabilityScore(rightMarket) : 0;
    const leftChange = leftMarket ? Math.abs(getMarketChange(leftMarket)) : 0;
    const rightChange = rightMarket ? Math.abs(getMarketChange(rightMarket)) : 0;
    const leftHasImage = Number(Boolean(left.image || left.icon || leftMarket?.image));
    const rightHasImage = Number(Boolean(right.image || right.icon || rightMarket?.image));

    return (
      compareNumbersDesc(leftCentered, rightCentered) ||
      compareNumbersDesc(leftChange, rightChange) ||
      compareNumbersDesc(leftHasImage, rightHasImage) ||
      compareNumbersDesc(left.volume24hr || left.volume, right.volume24hr || right.volume) ||
      compareNumbersDesc(Number(left.featured), Number(right.featured)) ||
      left.title.localeCompare(right.title)
    );
  });

const rankSpotlightEvent = (event: PolymarketEvent) => {
  const market = selectSpotlightMarket(event);
  if (!market) return null;

  const spotlightEligibleMarkets = event.markets.filter(isMarketEligibleForSpotlight);

  return {
    hasImage: Number(Boolean(event.image || event.icon || market.image || market.icon)),
    featured: Number(event.featured),
    hasMultipleMarkets: Number(spotlightEligibleMarkets.length > 1),
    marketCount: spotlightEligibleMarkets.length,
    nonSports: Number(!isSportsEvent(event)),
    editorialCategory: Number(getEventCategoryKey(event) !== "culture"),
    shortQuestion: Number(normalizeText(market.question).length <= 60),
    hasDescription: Number(Boolean(event.description?.trim())),
    balancedPrimary: Number(isBalancedSpotlightMarket(market)),
    activePrimary: Number(Math.abs(getMarketChange(market)) >= 0.05),
    conciseQuestion: getQuestionCompactnessScore(market),
    eventVolume: event.volume24hr || event.volume,
    marketVolume: getMarketVolume(market),
    marketChange: Math.abs(getMarketChange(market)),
    centeredPrice: getSpotlightProbabilityScore(market),
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
  const publishedLabel = formatRelativeAge(event.creationDate ?? event.startDate);
  const freshPublishedLabel =
    publishedLabel && !/^\d+d ago$/i.test(publishedLabel) ? publishedLabel : undefined;

  const pushRow = ({
    label,
    value,
    meta,
    stat,
    statTone = "neutral",
  }: HeroSourceRow) => {
    const normalized = normalizeText(value ?? "");
    if (normalized.length === 0) return;
    const dedupeKey = normalized.toLowerCase();
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);
    sourceRows.push({
      label,
      value: clampText(normalized, 64),
      meta,
      stat,
      statTone,
    });
  };

  pushRow({
    label: NEWSFEED_SOURCE_LABELS[0],
    value: clampText(descriptionSentences[0] ?? market.question, 48),
    meta: freshPublishedLabel ?? "10h ago",
    ...FALLBACK_SOURCE_STATS[0],
  });

  pushRow({
    label: NEWSFEED_SOURCE_LABELS[1],
    value: clampText(descriptionSentences[1] ?? market.question, 48),
    meta: freshPublishedLabel ?? "21h ago",
    ...FALLBACK_SOURCE_STATS[1],
  });

  pushRow({
    label: NEWSFEED_SOURCE_LABELS[2],
    value: clampText(descriptionSentences[2] ?? event.title, 48),
    meta: freshPublishedLabel ?? "1d ago",
    ...FALLBACK_SOURCE_STATS[2],
  });

  pushRow({
    label: NEWSFEED_SOURCE_LABELS[3],
    value: clampText(market.question, 48),
    meta: freshPublishedLabel ?? (event.endDate ? `By ${formatEndDate(event.endDate)}` : "1d ago"),
    ...FALLBACK_SOURCE_STATS[3],
  });

  pushRow({
    label: NEWSFEED_SOURCE_LABELS[4],
    value: clampText(event.title, 48),
    meta: freshPublishedLabel ?? "2d ago",
    ...FALLBACK_SOURCE_STATS[4],
  });

  return sourceRows.slice(0, 4);
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

const canSurfaceMarketChipTopic = (tag: PolymarketTag): boolean =>
  tag.slug.length > 0 &&
  tag.label.length > 0 &&
  !MARKET_CHIP_EXCLUDED_SLUGS.has(tag.slug) &&
  !tag.forceHide;

const compareTopicSummaries = (
  left: TopicSummary,
  right: TopicSummary,
): number =>
  compareNumbersDesc(left.totalVolume, right.totalVolume) ||
  compareNumbersDesc(left.eventCount, right.eventCount) ||
  left.label.localeCompare(right.label);

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

  return clampText(
    summary ?? event.title ?? market.question,
    96,
  );
};

const formatSpotlightOutcomeLabel = (market: PolymarketMarket): string =>
  clampText(
    normalizeText(market.groupItemTitle || market.question || "Outcome"),
    42,
  );

const buildSpotlightOutcomeItems = (
  event: PolymarketEvent,
  market: PolymarketMarket,
): Pick<HeroSpotlightModel, "outcomeItems" | "outcomeMode"> => {
  const href = getEventHref(event);
  const eligibleMarkets = event.markets.filter(isMarketEligibleForSpotlight);

  if (eligibleMarkets.length > 1) {
    return {
      outcomeMode: "multi-market",
      outcomeItems: [...eligibleMarkets]
        .sort(
          (left, right) =>
            compareNumbersDesc(
              getDisplayPrice(left),
              getDisplayPrice(right),
            ) ||
            compareNumbersDesc(
              getMarketVolume(left),
              getMarketVolume(right),
            ) ||
            compareNumbersDesc(
              Number(left.acceptingOrders),
              Number(right.acceptingOrders),
            ) ||
            left.question.localeCompare(right.question),
        )
        .slice(0, 4)
        .map((candidate) => ({
          marketId: candidate.id,
          label: formatSpotlightOutcomeLabel(candidate),
          chance: getDisplayPrice(candidate),
          href,
        })),
    };
  }

  const yesLabel = normalizeText(market.outcomes[0] ?? "Yes");
  const noLabel = normalizeText(market.outcomes[1] ?? "No");
  const yesChance = getDisplayPrice(market);
  const rawNoChance =
    market.outcomePrices[1] ?? (Number.isFinite(yesChance) ? 1 - yesChance : 0);
  const noChance = Math.max(0, Math.min(1, rawNoChance));

  return {
    outcomeMode: "binary",
    outcomeItems: [
      {
        marketId: `${market.id}-0`,
        label: yesLabel,
        chance: yesChance,
        href,
      },
      {
        marketId: `${market.id}-1`,
        label: noLabel,
        chance: noChance,
        href,
      },
    ],
  };
};

const buildHeroChipHref = (slug: string): string | undefined =>
  CATEGORY_ROUTES.get(slug);

const buildSpotlightNavigationLabel = (
  event: PolymarketEvent,
  market: PolymarketMarket,
  labels: Pick<HeroSpotlightModel, "categoryLabel" | "subcategoryLabel">,
): string => {
  const tagLabels = getPrimaryVisibleTags(event)
    .map((tag) => tag.label)
    .filter(isUsefulNavigationLabel);

  const candidates = [
    market.groupItemTitle,
    labels.subcategoryLabel,
    ...tagLabels,
    labels.categoryLabel,
    event.title,
  ].filter(isUsefulNavigationLabel);

  return formatNavigationLabel(candidates[0] ?? "Markets");
};

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
      compareNumbersDesc(
        getSpotlightProbabilityScore(left),
        getSpotlightProbabilityScore(right),
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
): PolymarketEvent | undefined => {
  return selectSpotlightEvents(events, 1)[0];
};

export const selectSpotlightEvents = (
  events: ReadonlyArray<PolymarketEvent>,
  limit = HOME_HERO_SPOTLIGHT_LIMIT,
): PolymarketEvent[] => {
  const candidates = events
    .map((event) => {
      const market = selectSpotlightMarket(event);
      const rank = market ? rankSpotlightEvent(event) : null;

      return market && rank ? { event, market, rank } : null;
    })
    .filter(
      (
        candidate,
      ): candidate is {
        event: PolymarketEvent;
        market: PolymarketMarket;
        rank: NonNullable<ReturnType<typeof rankSpotlightEvent>>;
      } => Boolean(candidate),
    );

  return candidates
    .sort((left, right) => {
      return (
        compareNumbersDesc(left.rank.featured, right.rank.featured) ||
        compareNumbersDesc(left.rank.hasMultipleMarkets, right.rank.hasMultipleMarkets) ||
        compareNumbersDesc(left.rank.marketCount, right.rank.marketCount) ||
        compareNumbersDesc(left.rank.nonSports, right.rank.nonSports) ||
        compareNumbersDesc(left.rank.editorialCategory, right.rank.editorialCategory) ||
        compareNumbersDesc(left.rank.hasDescription, right.rank.hasDescription) ||
        compareNumbersDesc(left.rank.balancedPrimary, right.rank.balancedPrimary) ||
        compareNumbersDesc(left.rank.activePrimary, right.rank.activePrimary) ||
        compareNumbersDesc(left.rank.eventVolume, right.rank.eventVolume) ||
        compareNumbersDesc(left.rank.marketVolume, right.rank.marketVolume) ||
        compareNumbersDesc(left.rank.marketChange, right.rank.marketChange) ||
        compareNumbersDesc(left.rank.centeredPrice, right.rank.centeredPrice) ||
        compareNumbersDesc(left.rank.hasImage, right.rank.hasImage) ||
        compareNumbersDesc(left.rank.conciseQuestion, right.rank.conciseQuestion) ||
        compareNumbersDesc(left.rank.shortQuestion, right.rank.shortQuestion) ||
        left.event.title.localeCompare(right.event.title)
      );
    })
    .slice(0, limit)
    .map(({ event }) => event);
};

export const selectHeroPulse = (
  events: ReadonlyArray<PolymarketEvent>,
  {
    excludeEventId,
    limit = 3,
  }: {
    excludeEventId?: string;
    limit?: number;
  } = {},
): HeroPulseItem[] => {
  const selected: HeroPulseItem[] = [];
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

const selectHeroTopics = (
  events: ReadonlyArray<PolymarketEvent>,
  limit = 5,
): HeroTopicItem[] => buildTopicItems(events, limit);

const selectHeroContextChips = (
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

  pushChip({ slug: "all", label: "All", href: "#markets" });

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

const buildHomeMarketChips = (
  events: ReadonlyArray<PolymarketEvent>,
  limit = 30,
): HeroChip[] => {
  const chips: HeroChip[] = [{ slug: "all", label: "All" }];
  const topicMap = new Map<string, TopicSummary>();

  for (const event of events) {
    for (const tag of getVisibleTags(event)) {
      if (!canSurfaceMarketChipTopic(tag)) {
        continue;
      }

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

  const rankedTopics = [
    ...[...topicMap.values()]
      .filter((topic) => PRIMARY_CATEGORY_SLUGS.has(topic.slug))
      .sort(compareTopicSummaries),
    ...[...topicMap.values()]
      .filter((topic) => !PRIMARY_CATEGORY_SLUGS.has(topic.slug))
      .sort(compareTopicSummaries),
  ];
  const seen = new Set<string>(["all"]);

  for (const topic of rankedTopics) {
    if (chips.length >= limit) break;
    if (seen.has(topic.slug)) continue;
    seen.add(topic.slug);
    chips.push({
      slug: topic.slug,
      label: topic.label,
      href: buildHeroChipHref(topic.slug),
    });
  }

  return chips;
};

export const selectHomeFeedEvents = (
  events: ReadonlyArray<PolymarketEvent>,
  {
    spotlightEventId,
    limit = HOME_EXPLORE_EVENT_LIMIT,
  }: {
    spotlightEventId?: string;
    limit?: number;
  } = {},
): PolymarketEvent[] => {
  const ranked = getHomeFeedRankedEvents(events).filter(
    (event) => event.id !== spotlightEventId,
  );
  const buckets = new Map<string, PolymarketEvent[]>();

  for (const event of ranked) {
    const bucket = getEventCategoryKey(event);
    const list = buckets.get(bucket);
    if (list) {
      list.push(event);
      continue;
    }
    buckets.set(bucket, [event]);
  }

  const sectorLeadOrder = ["politics", "world", "crypto", "sports"];
  const preferredOrder = [
    ...sectorLeadOrder,
    "economy",
    "culture",
    "tech",
  ];
  const selected: PolymarketEvent[] = [];
  const seen = new Set<string>();

  const sectorLeadMatchers: Record<
    (typeof sectorLeadOrder)[number],
    (event: PolymarketEvent) => boolean
  > = {
    politics: isPoliticsLeadEvent,
    world: isWorldEvent,
    crypto: (event) => hasTagSlug(event, "crypto"),
    sports: isSportsEvent,
  };
  const directSectorLeadMatchers: Record<
    (typeof sectorLeadOrder)[number],
    (event: PolymarketEvent) => boolean
  > = {
    politics: isDirectPoliticsLeadEvent,
    world: isDirectWorldLeadEvent,
    crypto: isDirectCryptoLeadEvent,
    sports: isDirectSportsLeadEvent,
  };

  for (const key of sectorLeadOrder) {
    const next =
      ranked.find(
        (event) => !seen.has(event.id) && directSectorLeadMatchers[key](event),
      ) ??
      ranked.find(
        (event) => !seen.has(event.id) && sectorLeadMatchers[key](event),
      );

    if (!next || seen.has(next.id) || selected.length >= limit) {
      continue;
    }

    seen.add(next.id);
    selected.push(next);
  }

  for (const [key, bucket] of buckets.entries()) {
    buckets.set(
      key,
      bucket.filter((event) => !seen.has(event.id)),
    );
  }

  while (selected.length < limit) {
    let madeProgress = false;

    for (const key of preferredOrder) {
      const bucket = buckets.get(key);
      if (!bucket || bucket.length === 0) continue;
      const next = bucket.shift();
      if (!next || seen.has(next.id)) continue;
      seen.add(next.id);
      selected.push(next);
      madeProgress = true;
      if (selected.length >= limit) break;
    }

    if (!madeProgress) {
      break;
    }
  }

  return selected;
};

const selectHomeMarketChips = (
  events: ReadonlyArray<PolymarketEvent>,
  limit = 30,
): HeroChip[] => buildHomeMarketChips(events, limit);

const buildHeroSpotlightModel = (
  event: PolymarketEvent,
  market: PolymarketMarket,
  chart: HeroChartModel | null,
): HeroSpotlightModel => {
  const labels = buildSpotlightLabels(event);
  const outcomeModel = buildSpotlightOutcomeItems(event, market);

  return {
    event,
    market,
    tokenId: market.clobTokenIds[0],
    chart: chart && chart.points.length >= 5 ? chart : null,
    headline: buildSpotlightHeadline(event, market),
    summary: buildSpotlightSummary(event, market),
    ...labels,
    chance: getDisplayPrice(market),
    dayChange: getMarketChange(market),
    volumeLabel: formatVolume(
      event.volume || event.volume24hr || getMarketVolume(market),
    ),
    notes: buildSpotlightNotes(event, market),
    sourceRows: buildFallbackSourceRows(event, market),
    sourceMode: "fallback-derived" as const,
    ...outcomeModel,
    href: getEventHref(event),
    navigationLabel: buildSpotlightNavigationLabel(event, market, labels),
  };
};

export const buildHomeHeroModel = (
  events: ReadonlyArray<PolymarketEvent>,
  {
    spotlightChart = null,
    spotlightCharts = {},
    spotlightLimit = HOME_HERO_SPOTLIGHT_LIMIT,
    pulseLimit = 3,
    topicLimit = 5,
    contextChipLimit = 8,
  }: {
    spotlightChart?: HeroChartModel | null;
    spotlightCharts?: Record<string, HeroChartModel | null>;
    spotlightLimit?: number;
    pulseLimit?: number;
    topicLimit?: number;
    contextChipLimit?: number;
  } = {},
): HomeHeroModel => {
  const spotlightEvents = selectSpotlightEvents(events, spotlightLimit);
  const spotlights = spotlightEvents
    .map((event, index) => {
      const market = selectSpotlightMarket(event);
      if (!market) return null;

      const chart =
        spotlightCharts[market.id] ??
        (index === 0 ? spotlightChart : null);

      return buildHeroSpotlightModel(event, market, chart);
    })
    .filter((spotlight): spotlight is HeroSpotlightModel => Boolean(spotlight));

  const spotlight = spotlights[0] ?? null;
  const topics = selectHeroTopics(events, topicLimit);

  return {
    spotlights,
    spotlight,
    pulse: selectHeroPulse(events, {
      excludeEventId: spotlight?.event.id,
      limit: pulseLimit,
    }),
    topics,
    contextChips: selectHeroContextChips(spotlight, topics, contextChipLimit),
  };
};

export const buildHomePageModel = (
  events: ReadonlyArray<PolymarketEvent>,
  {
    spotlightChart = null,
    spotlightCharts = {},
    exploreLimit = HOME_EXPLORE_EVENT_LIMIT,
    marketChipLimit = 30,
  }: {
    spotlightChart?: HeroChartModel | null;
    spotlightCharts?: Record<string, HeroChartModel | null>;
    exploreLimit?: number;
    marketChipLimit?: number;
  } = {},
): HomePageModel => {
  const hero = buildHomeHeroModel(events, { spotlightChart, spotlightCharts });
  const exploreEvents = selectHomeFeedEvents(events, {
    spotlightEventId: hero.spotlight?.event.id,
    limit: exploreLimit,
  });

  return {
    hero,
    marketChips: selectHomeMarketChips(events, marketChipLimit),
    exploreEvents,
  };
};
