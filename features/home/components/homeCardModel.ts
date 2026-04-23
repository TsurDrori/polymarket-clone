import { getEventImage } from "@/features/events/api/parse";
import type { SurfaceFeedItem } from "@/features/events/feed/types";
import type { PolymarketEvent, PolymarketMarket } from "@/features/events/types";
import {
  buildHydrationSeedsFromEvents,
  type PriceHydrationSeed,
} from "@/features/realtime/seeds";
import { buildSportsGameRows, type SportsGameEvent } from "@/features/sports/games/parse";
import { parseDisplayedSportsScoreParts } from "@/features/sports/scoreDisplay";
import {
  buildCryptoWorkingSet,
  compareCryptoEventsForDisplay,
  deriveCryptoFamily,
} from "@/features/crypto/parse";
import { formatVolume } from "@/shared/lib/format";
import { getVisibleTags } from "@/shared/lib/tags";
import {
  getPrimaryMarket,
  selectHomeFeedEvents,
  selectSpotlightMarket,
} from "../selectors";

type HomeCardFamily =
  | "binary"
  | "grouped"
  | "crypto-up-down"
  | "sports-live";

export type HomeCardActionModel = {
  label: string;
  price: number;
  tokenId?: string;
};

export type HomeCardRowModel = {
  id: string;
  label: string;
  tokenId?: string;
  price: number;
  actions: [HomeCardActionModel, HomeCardActionModel];
};

export type HomeBinaryCardModel = {
  kind: "binary";
  theme: "general" | "sports";
  title: string;
  href: string;
  imageSrc: string;
  metaLabels: string[];
  primaryTokenId?: string;
  primaryPrice: number;
  primaryChange: number;
  primaryDateLabel: string;
  volumeLabel: string;
  actions: [HomeCardActionModel, HomeCardActionModel];
};

export type HomeGroupedCardModel = {
  kind: "grouped";
  title: string;
  href: string;
  imageSrc: string;
  metaLabels: string[];
  primaryTokenId?: string;
  primaryPrice: number;
  primaryChange: number;
  primaryDateLabel: string;
  volumeLabel: string;
  rows: HomeCardRowModel[];
};

export type HomeCryptoUpDownCardModel = {
  kind: "crypto-up-down";
  title: string;
  href: string;
  imageSrc: string;
  metaLabels: string[];
  assetLabel?: string;
  volumeLabel: string;
  liveLabel: string;
  tokenId?: string;
  price: number;
  actions: [HomeCardActionModel, HomeCardActionModel];
};

export type HomeSportsLiveCardModel = {
  kind: "sports-live";
  title: string;
  href: string;
  imageSrc: string;
  metaLabels: string[];
  volumeLabel: string;
  statusLabel: string;
  statusDetail?: string;
  competitors: {
    key: string;
    name: string;
    shortName: string;
    logo?: string;
    score?: string;
    subtitle?: string;
    tokenId?: string;
    price: number;
  }[];
};

export type HomeCardModel =
  | HomeBinaryCardModel
  | HomeGroupedCardModel
  | HomeCryptoUpDownCardModel
  | HomeSportsLiveCardModel;

export type HomeCardEntry = {
  id: string;
  model: HomeCardModel;
  motionKey: string;
  tokenIds: string[];
  hydrationSeeds: PriceHydrationSeed[];
  volume: number;
};

const HOME_GROUPED_ROW_LIMIT = 2;

const clampPrice = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
};

const getOutcomeActionPrice = (market: PolymarketMarket, index: number): number => {
  if (index === 0) {
    return getDisplayPrice(market);
  }

  const directPrice = market.outcomePrices[index];
  if (Number.isFinite(directPrice)) {
    return clampPrice(directPrice);
  }

  return clampPrice(1 - getDisplayPrice(market));
};

const formatShortEndDate = (iso?: string): string => {
  if (!iso) return "";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
};

const getDisplayPrice = (market: PolymarketMarket): number =>
  clampPrice(market.lastTradePrice || market.outcomePrices[0] || market.bestBid || 0);

const normalizeOutcomeLabel = (value: string | undefined, fallback: string): string => {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (trimmed.length === 0) return fallback;
  return trimmed.length <= 14 ? trimmed : fallback;
};

const getOutcomeLabels = (market: PolymarketMarket): [string, string] => [
  normalizeOutcomeLabel(market.outcomes[0], "Yes"),
  normalizeOutcomeLabel(market.outcomes[1], "No"),
];

const isMarketVisible = (market: PolymarketMarket): boolean => !market.closed;

const getVisibleMarkets = (event: PolymarketEvent): PolymarketMarket[] => {
  const visibleMarkets = event.markets.filter(isMarketVisible);
  return visibleMarkets.length > 0 ? visibleMarkets : event.markets;
};

const getHomeCardMarkets = (event: PolymarketEvent): PolymarketMarket[] => {
  const marketsToDisplay = getVisibleMarkets(event);

  if (event.showAllOutcomes && marketsToDisplay.length > 1) {
    return marketsToDisplay.slice(0, HOME_GROUPED_ROW_LIMIT);
  }

  return marketsToDisplay.slice(0, 1);
};

const getPrimaryHomeMarket = (
  event: PolymarketEvent,
): PolymarketMarket | undefined => selectSpotlightMarket(event) ?? getPrimaryMarket(event);

const buildMetaLabels = (event: PolymarketEvent): string[] => {
  const [primaryTag, secondaryTag] = getVisibleTags(event);

  return [primaryTag?.label, secondaryTag?.label].filter(
    (value): value is string => Boolean(value),
  );
};

const normalizeTagSlug = (value: string): string => value.trim().toLowerCase();

const isSportsTaggedEvent = (event: PolymarketEvent): boolean =>
  event.tags.some((tag) => normalizeTagSlug(tag.slug) === "sports");

const hasSportsIdentity = (event: PolymarketEvent): boolean =>
  isSportsTaggedEvent(event) || typeof event.eventMetadata?.league === "string";

const isSportsMatchupMarket = (market: PolymarketMarket): boolean =>
  market.sportsMarketType === "moneyline" ||
  market.sportsMarketType === "spreads" ||
  market.sportsMarketType === "totals" ||
  market.sportsMarketType === "map_handicap";

const buildActionPair = (
  market: PolymarketMarket,
  labels?: [string, string],
): [HomeCardActionModel, HomeCardActionModel] => {
  const [primaryLabel, secondaryLabel] = labels ?? getOutcomeLabels(market);

  return [
    {
      label: primaryLabel,
      price: getOutcomeActionPrice(market, 0),
      tokenId: market.clobTokenIds[0],
    },
    {
      label: secondaryLabel,
      price: getOutcomeActionPrice(market, 1),
      tokenId: market.clobTokenIds[1],
    },
  ];
};

const buildGroupedRows = (event: PolymarketEvent): HomeCardRowModel[] =>
  getVisibleMarkets(event)
    .slice(0, HOME_GROUPED_ROW_LIMIT)
    .map((market) => ({
      id: market.id,
      label:
        market.groupItemTitle ||
        formatShortEndDate(market.endDate || event.endDate) ||
        market.question,
      tokenId: market.clobTokenIds[0],
      price: getDisplayPrice(market),
      actions: buildActionPair(market),
    }));

const isSportsLiveEvent = (event: PolymarketEvent): boolean =>
  hasSportsIdentity(event) &&
  (event.teams?.length ?? 0) >= 2 &&
  event.markets.some(isSportsMatchupMarket);

export const resolveHomeCardFamily = (event: PolymarketEvent): HomeCardFamily => {
  if (isSportsLiveEvent(event)) {
    return "sports-live";
  }

  if (deriveCryptoFamily(event) === "up-down") {
    return "crypto-up-down";
  }

  if (event.showAllOutcomes && getVisibleMarkets(event).length > 1) {
    return "grouped";
  }

  return "binary";
};

const buildBinaryModel = (event: PolymarketEvent): HomeBinaryCardModel => {
  const primaryMarket = getPrimaryHomeMarket(event) ?? getVisibleMarkets(event)[0];
  const primaryPrice = primaryMarket ? getDisplayPrice(primaryMarket) : 0;

  return {
    kind: "binary",
    theme: hasSportsIdentity(event) ? "sports" : "general",
    title: event.title,
    href: `/event/${event.slug}`,
    imageSrc: getEventImage(event) ?? "/placeholder.svg",
    metaLabels: buildMetaLabels(event),
    primaryTokenId: primaryMarket?.clobTokenIds[0],
    primaryPrice,
    primaryChange: primaryMarket?.oneDayPriceChange ?? 0,
    primaryDateLabel: formatShortEndDate(primaryMarket?.endDate || event.endDate),
    volumeLabel: `${formatVolume(event.volume24hr || event.volume)} Vol.`,
    actions: primaryMarket
      ? buildActionPair(primaryMarket)
      : [
          { label: "Yes", price: primaryPrice },
          { label: "No", price: clampPrice(1 - primaryPrice) },
        ],
  };
};

const buildGroupedModel = (event: PolymarketEvent): HomeGroupedCardModel => {
  const primaryMarket = getPrimaryHomeMarket(event) ?? getVisibleMarkets(event)[0];

  return {
    kind: "grouped",
    title: event.title,
    href: `/event/${event.slug}`,
    imageSrc: getEventImage(event) ?? "/placeholder.svg",
    metaLabels: buildMetaLabels(event),
    primaryTokenId: primaryMarket?.clobTokenIds[0],
    primaryPrice: primaryMarket ? getDisplayPrice(primaryMarket) : 0,
    primaryChange: primaryMarket?.oneDayPriceChange ?? 0,
    primaryDateLabel: formatShortEndDate(primaryMarket?.endDate || event.endDate),
    volumeLabel: `${formatVolume(event.volume24hr || event.volume)} Vol.`,
    rows: buildGroupedRows(event),
  };
};

const buildCryptoUpDownModel = (event: PolymarketEvent): HomeCryptoUpDownCardModel => {
  const primaryMarket = getPrimaryHomeMarket(event) ?? getVisibleMarkets(event)[0];
  const cryptoCard = buildCryptoWorkingSet([event]).cards[0];
  const primarySnippet = cryptoCard?.primarySnippet;
  const [upLabel, downLabel] = primarySnippet
    ? [primarySnippet.primaryOutcomeLabel, primarySnippet.secondaryOutcomeLabel]
    : primaryMarket
      ? getOutcomeLabels(primaryMarket)
      : (["Up", "Down"] as [string, string]);
  const price = primarySnippet?.fallbackPrice ?? (primaryMarket ? getDisplayPrice(primaryMarket) : 0);

  return {
    kind: "crypto-up-down",
    title: event.title,
    href: `/event/${event.slug}`,
    imageSrc: getEventImage(event) ?? "/placeholder.svg",
    metaLabels: buildMetaLabels(event),
    assetLabel: cryptoCard?.metaLabel ?? undefined,
    volumeLabel: `${formatVolume(event.volume24hr || event.volume)} Vol.`,
    liveLabel: cryptoCard?.showLiveDot ? "Live" : "Crypto",
    tokenId: primarySnippet?.tokenId ?? primaryMarket?.clobTokenIds[0],
    price,
    actions: primaryMarket || primarySnippet
      ? [
          { label: upLabel, price },
          { label: downLabel, price: clampPrice(1 - price) },
        ]
      : [
          { label: upLabel, price: 0.5 },
          { label: downLabel, price: 0.5 },
        ],
  };
};

const selectHomeCryptoEntry = (
  cryptoEvents: ReadonlyArray<PolymarketEvent>,
): HomeCardEntry | undefined => {
  const [bestEvent] = [...cryptoEvents]
    .filter((event) => deriveCryptoFamily(event) === "up-down")
    .sort(compareCryptoEventsForDisplay);

  return bestEvent ? buildHomeCardEntry(bestEvent) : undefined;
};

const getHomeSportsVolumeLabel = (
  event: PolymarketEvent,
  eventVolume?: number,
): string =>
  `${formatVolume(eventVolume ?? (event.volume24hr > 0 ? event.volume24hr : event.volume))} Vol.`;

const buildSportsLiveModel = (event: PolymarketEvent): HomeSportsLiveCardModel => {
  const scoreParts = parseDisplayedSportsScoreParts(event.score);
  const sportsEvent: SportsGameEvent = {
    id: event.id,
    slug: event.slug,
    title: event.title,
    startTime: event.startDate,
    endDate: event.endDate,
    volume: event.volume,
    volume24hr: event.volume24hr,
    live: event.live ?? false,
    ended: event.ended ?? false,
    period: event.period,
    score: event.score,
    eventWeek: event.eventWeek,
    image: event.image,
    icon: event.icon,
    tags: event.tags,
    teams: event.teams ?? [],
    eventMetadata: event.eventMetadata,
    markets: event.markets.map((market) => ({
      ...market,
      line: market.line ?? null,
    })),
  };
  const [row] = buildSportsGameRows([sportsEvent]);

  return {
    kind: "sports-live",
    title: event.title,
    href: `/event/${event.slug}`,
    imageSrc: getEventImage(event) ?? "/placeholder.svg",
    metaLabels: row ? [row.league.label] : buildMetaLabels(event),
    volumeLabel: getHomeSportsVolumeLabel(event, row?.eventVolume),
    statusLabel: row?.statusLabel ?? (event.live ? "Live" : "Upcoming"),
    statusDetail: row?.statusDetail ?? event.period,
    competitors:
      row?.competitors.slice(0, 2).map((competitor, index) => ({
        key: competitor.key,
        name: competitor.name,
        shortName: competitor.abbreviation || competitor.name,
        logo: competitor.logo,
        score: scoreParts[index],
        subtitle: competitor.record,
        tokenId: row.moneyline[index]?.tokenId,
        price: row.moneyline[index]?.price ?? 0,
      })) ??
      (event.teams ?? []).slice(0, 2).map((team, index) => ({
        key: `${event.id}:${team.name}`,
        name: team.name,
        shortName: team.abbreviation || team.name,
        logo: team.logo,
        score: scoreParts[index],
        subtitle: team.record,
        tokenId: event.markets[index]?.clobTokenIds[0],
        price: getDisplayPrice(event.markets[index] ?? event.markets[0]),
      })),
  };
};

const adaptSportsGameEventToPolymarketEvent = (event: SportsGameEvent): PolymarketEvent => ({
  id: event.id,
  ticker: event.slug,
  slug: event.slug,
  title: event.title,
  startDate: event.startTime,
  endDate: event.endDate,
  image: event.image,
  icon: event.icon,
  active: !event.ended,
  closed: event.ended,
  archived: false,
  featured: false,
  restricted: false,
  live: event.live,
  ended: event.ended,
  period: event.period,
  score: event.score,
  eventWeek: event.eventWeek,
  liquidity: 0,
  volume: event.volume,
  volume24hr: event.volume24hr,
  negRisk: false,
  showAllOutcomes: false,
  showMarketImages: false,
  tags: event.tags,
  teams: event.teams,
  eventMetadata: event.eventMetadata,
  markets: event.markets.map((market) => ({
    id: market.id,
    question: market.question,
    conditionId: market.id,
    slug: market.id,
    groupItemTitle: market.groupItemTitle,
    sportsMarketType: market.sportsMarketType,
    line: market.line,
    outcomes: market.outcomes,
    outcomePrices: market.outcomePrices,
    clobTokenIds: market.clobTokenIds,
    volumeNum: market.volumeNum,
    liquidityNum: 0,
    lastTradePrice: market.lastTradePrice,
    bestBid: market.bestBid,
    bestAsk: market.bestAsk,
    volume24hr: market.volume24hr,
    oneDayPriceChange: 0,
    spread: 0,
    acceptingOrders: market.acceptingOrders,
    closed: market.closed,
  })),
});

export const buildHomeCardModel = (event: PolymarketEvent): HomeCardModel => {
  switch (resolveHomeCardFamily(event)) {
    case "sports-live":
      return buildSportsLiveModel(event);
    case "crypto-up-down":
      return buildCryptoUpDownModel(event);
    case "grouped":
      return buildGroupedModel(event);
    case "binary":
      return buildBinaryModel(event);
  }
};

const buildHomeCardEntry = (event: PolymarketEvent): HomeCardEntry => {
  const model = buildHomeCardModel(event);

  return {
    id: event.id,
    model,
    motionKey: getHomeCardMotionKey(event),
    tokenIds: [...new Set(getHomeCardMarkets(event).flatMap((market) => market.clobTokenIds))].filter(
      Boolean,
    ),
    hydrationSeeds: buildHydrationSeedsFromEvents([event]),
    volume: event.volume24hr || event.volume,
  };
};

const buildHomeSportsLiveCardEntry = (
  event: SportsGameEvent,
): HomeCardEntry => buildHomeCardEntry(adaptSportsGameEventToPolymarketEvent(event));

export const buildHomeEventCardEntries = (
  events: ReadonlyArray<PolymarketEvent>,
): HomeCardEntry[] => events.map(buildHomeCardEntry);

const appendUniqueEntry = (
  target: HomeCardEntry[],
  seen: Set<string>,
  entry: HomeCardEntry | undefined,
) => {
  if (!entry || seen.has(entry.id)) return;
  seen.add(entry.id);
  target.push(entry);
};

export const buildHomeExploreCardEntries = ({
  events,
  cryptoEvents = [],
  sportsEvents = [],
  limit = 16,
}: {
  events: ReadonlyArray<PolymarketEvent>;
  cryptoEvents?: ReadonlyArray<PolymarketEvent>;
  sportsEvents?: ReadonlyArray<SportsGameEvent>;
  limit?: number;
}): HomeCardEntry[] => {
  const cryptoEntry = selectHomeCryptoEntry(cryptoEvents);
  const baseEntries = buildHomeEventCardEntries(events).filter(
    (entry) => entry.model.kind !== "crypto-up-down" || entry.id === cryptoEntry?.id,
  );
  const groupedEntries = baseEntries.filter((entry) => entry.model.kind === "grouped");
  const binaryEntries = baseEntries.filter((entry) => entry.model.kind === "binary");
  const leadEvents = selectHomeFeedEvents(events, { limit: 4 });
  const leadEntries = leadEvents
    .map(buildHomeCardEntry)
    .filter((entry) => entry.model.kind !== "crypto-up-down" || entry.id === cryptoEntry?.id);
  const sportsEntry = sportsEvents
    .map(buildHomeSportsLiveCardEntry)
    .find((entry) => entry.model.kind === "sports-live");

  const curated: HomeCardEntry[] = [];
  const seen = new Set<string>();

  [
    leadEntries[0],
    leadEntries[1],
    cryptoEntry ?? leadEntries[2],
    sportsEntry ?? leadEntries[3],
    groupedEntries[0],
    cryptoEntry,
    groupedEntries[1] ?? binaryEntries[0],
    binaryEntries[0],
    binaryEntries[1],
    sportsEntry,
    groupedEntries[2],
    groupedEntries[3],
  ].forEach((entry) => {
    appendUniqueEntry(curated, seen, entry);
  });

  for (const entry of baseEntries) {
    appendUniqueEntry(curated, seen, entry);
    if (curated.length >= limit) {
      break;
    }
  }

  return curated.slice(0, limit);
};

export const getHomeCardTokenIds = (item: SurfaceFeedItem<HomeCardEntry>): string[] => {
  const tokenIds = new Set<string>();
  const { model } = item.model;

  switch (model.kind) {
    case "binary":
      if (model.primaryTokenId) {
        tokenIds.add(model.primaryTokenId);
      }
      break;
    case "grouped":
      if (model.primaryTokenId) {
        tokenIds.add(model.primaryTokenId);
      }
      for (const row of model.rows) {
        if (row.tokenId) {
          tokenIds.add(row.tokenId);
        }
      }
      break;
    case "crypto-up-down":
      if (model.tokenId) {
        tokenIds.add(model.tokenId);
      }
      break;
    case "sports-live":
      for (const competitor of model.competitors) {
        if (competitor.tokenId) {
          tokenIds.add(competitor.tokenId);
        }
      }
      break;
  }

  return [...tokenIds];
};

const getTokenDelta = (
  tokenId: string | undefined,
  fallbackPrice: number,
  readPrice: (tokenId: string) => number,
): number => {
  if (!tokenId) {
    return 0;
  }

  return Math.abs(readPrice(tokenId) - fallbackPrice);
};

export const getHomeCardLiveScore = (
  item: SurfaceFeedItem<HomeCardEntry>,
  readTick: (tokenId: string) => { price: number },
): number => {
  const { model } = item.model;
  const volumeBias = Math.min(item.model.volume, 5_000_000) / 5_000_000;

  switch (model.kind) {
    case "binary":
      return (
        getTokenDelta(
          model.primaryTokenId,
          model.primaryPrice,
          (tokenId) => readTick(tokenId).price,
        ) +
        volumeBias * 0.002
      );
    case "grouped":
      return (
        Math.max(
          getTokenDelta(
            model.primaryTokenId,
            model.primaryPrice,
            (tokenId) => readTick(tokenId).price,
          ),
          ...model.rows.map((row) =>
            getTokenDelta(row.tokenId, row.price, (tokenId) => readTick(tokenId).price),
          ),
        ) +
        volumeBias * 0.002 +
        0.01
      );
    case "crypto-up-down":
      return (
        getTokenDelta(
          model.tokenId,
          model.price,
          (tokenId) => readTick(tokenId).price,
        ) +
        volumeBias * 0.002 +
        0.008
      );
    case "sports-live":
      return (
        Math.max(
          0,
          ...model.competitors.map((competitor) =>
            getTokenDelta(
              competitor.tokenId,
              competitor.price,
              (tokenId) => readTick(tokenId).price,
            ),
          ),
        ) +
        volumeBias * 0.002 +
        0.012
      );
  }
};
const getHomeCardMotionKey = (event: PolymarketEvent): string =>
  getPrimaryHomeMarket(event)?.id ?? event.id;
