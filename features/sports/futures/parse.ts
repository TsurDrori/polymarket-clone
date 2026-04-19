import { getEventImage } from "@/features/events/api/parse";
import type {
  PolymarketEvent,
  PolymarketMarket,
  PolymarketTag,
} from "@/features/events/types";

export type SportsCardLeague = {
  slug: string;
  label: string;
};

export type SportsLeagueChip = SportsCardLeague & {
  count: number;
  href: string;
  active?: boolean;
};

export type SportsMarketPreview = {
  id: string;
  label: string;
  question: string;
  yesTokenId: string | null;
  noTokenId: string | null;
  yesFallbackPrice: number;
  noFallbackPrice: number;
  volume: number;
};

export type SportsCardModel = {
  id: string;
  slug: string;
  title: string;
  imageSrc: string | null;
  league: SportsCardLeague;
  volumeLabel: string;
  totalOutcomeCount: number;
  previewOutcomes: ReadonlyArray<SportsMarketPreview>;
  showMoreHref: string;
  event: PolymarketEvent;
};

const GENERIC_LEAGUE_SLUGS = new Set([
  "sports",
  "games",
  "hide-from-new",
  "basketball",
  "soccer",
  "football",
  "baseball",
  "hockey",
  "tennis",
  "cricket",
  "esports",
]);

const LEAGUE_PRIORITY = [
  "nba",
  "ucl",
  "nhl",
  "ufc",
  "epl",
  "nfl",
  "mlb",
  "wta",
  "atp",
  "league-of-legends",
  "counter-strike-2",
  "dota-2",
] as const;

const LEAGUE_LABEL_OVERRIDES: Record<string, string> = {
  nba: "NBA",
  nhl: "NHL",
  nfl: "NFL",
  mlb: "MLB",
  ufc: "UFC",
  ucl: "UCL",
  epl: "EPL",
  wta: "WTA",
  atp: "ATP",
  "league-of-legends": "League of Legends",
  "counter-strike-2": "Counter-Strike 2",
  "dota-2": "Dota 2",
  "premier-league": "EPL",
  formula1: "F1",
};

const clampProbability = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
};

const normalizeSlug = (value: string): string =>
  value.trim().toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-|-$/g, "");

const normalizeLabel = (slug: string, label?: string): string => {
  const normalizedSlug = normalizeSlug(slug);
  const override = LEAGUE_LABEL_OVERRIDES[normalizedSlug];

  if (override) return override;
  if (label && label.length <= 4) return label.toUpperCase();
  if (label) return label;

  return normalizedSlug
    .split("-")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
};

const getEventVolume = (event: PolymarketEvent): number =>
  event.volume24hr > 0 ? event.volume24hr : event.volume;

const formatSportsVolume = (value: number): string => {
  if (!Number.isFinite(value) || value <= 0) return "$0";

  const absolute = Math.abs(value);
  if (absolute >= 1_000_000) {
    const decimals = absolute >= 10_000_000 ? 1 : 2;
    return `$${(value / 1_000_000).toFixed(decimals).replace(/\.0$/, "")}M`;
  }

  if (absolute >= 1_000) {
    const decimals = absolute >= 100_000 ? 1 : 2;
    return `$${(value / 1_000).toFixed(decimals).replace(/\.0$/, "")}K`;
  }

  return `$${Math.round(value)}`;
};

const getPreferredTag = (event: PolymarketEvent): PolymarketTag | undefined => {
  const candidates = event.tags.filter((tag) => {
    const slug = normalizeSlug(tag.slug);
    return !["sports", "games", "hide-from-new"].includes(slug);
  });

  for (const slug of LEAGUE_PRIORITY) {
    const priorityTag = candidates.find((tag) => normalizeSlug(tag.slug) === slug);
    if (priorityTag) return priorityTag;
  }

  const specificTag = candidates.find(
    (tag) => !GENERIC_LEAGUE_SLUGS.has(normalizeSlug(tag.slug)),
  );

  return specificTag ?? candidates[0];
};

const hasGamesSemantics = (event: PolymarketEvent): boolean =>
  event.tags.some((tag) => normalizeSlug(tag.slug) === "games") ||
  event.markets.some((market) => Boolean(market.sportsMarketType));

const getMarketYesPrice = (market: PolymarketMarket): number => {
  const outcomePrice = market.outcomePrices[0];
  if (Number.isFinite(outcomePrice)) {
    return clampProbability(outcomePrice);
  }

  return clampProbability(market.lastTradePrice);
};

const getMarketNoPrice = (market: PolymarketMarket): number => {
  const outcomePrice = market.outcomePrices[1];
  if (Number.isFinite(outcomePrice)) {
    return clampProbability(outcomePrice);
  }

  return clampProbability(1 - getMarketYesPrice(market));
};

const getMarketVolume = (market: PolymarketMarket): number =>
  market.volume24hr > 0 ? market.volume24hr : market.volumeNum;

const getPreviewLabel = (
  event: PolymarketEvent,
  market: PolymarketMarket,
): string => {
  const label = market.groupItemTitle?.trim();
  if (label) return label;
  if (event.markets.length === 1) return "Chance";
  return market.question.trim();
};

const comparePreviewMarkets = (
  left: PolymarketMarket,
  right: PolymarketMarket,
): number =>
  Number(right.acceptingOrders && !right.closed) -
    Number(left.acceptingOrders && !left.closed) ||
  getMarketYesPrice(right) - getMarketYesPrice(left) ||
  getMarketVolume(right) - getMarketVolume(left) ||
  (right.groupItemTitle ?? right.question).localeCompare(left.groupItemTitle ?? left.question) ||
  left.id.localeCompare(right.id);

const selectPreviewMarkets = (
  event: PolymarketEvent,
  previewLimit: number,
): PolymarketMarket[] => {
  const candidateMarkets = event.markets.filter(
    (market) => market.outcomes.length >= 2 && market.clobTokenIds.length >= 2,
  );
  if (candidateMarkets.length === 0) return [];

  return [...candidateMarkets]
    .sort(comparePreviewMarkets)
    .slice(0, previewLimit);
};

const compareCards = (left: SportsCardModel, right: SportsCardModel): number =>
  getEventVolume(right.event) - getEventVolume(left.event) ||
  right.previewOutcomes.length - left.previewOutcomes.length ||
  left.title.localeCompare(right.title) ||
  left.id.localeCompare(right.id);

const sortLeagueEntries = (
  entries: ReadonlyArray<{
    league: SportsCardLeague;
    cards: SportsCardModel[];
  }>,
): {
  league: SportsCardLeague;
  cards: SportsCardModel[];
}[] =>
  [...entries].sort((left, right) => {
    const leftVolume = left.cards.reduce(
      (sum, card) => sum + getEventVolume(card.event),
      0,
    );
    const rightVolume = right.cards.reduce(
      (sum, card) => sum + getEventVolume(card.event),
      0,
    );

    return (
      rightVolume - leftVolume ||
      right.cards.length - left.cards.length ||
      left.league.label.localeCompare(right.league.label)
    );
  });

export const formatSportsPct = (price: number): string => {
  const clamped = clampProbability(price);
  if (clamped > 0 && clamped < 0.01) return "<1%";
  return `${Math.round(clamped * 100)}%`;
};

export const isSportsCardEvent = (event: PolymarketEvent): boolean => {
  if (!event.tags.some((tag) => normalizeSlug(tag.slug) === "sports")) return false;
  if (hasGamesSemantics(event)) return false;
  return event.markets.some(
    (market) => market.outcomes.length >= 2 && market.clobTokenIds.length >= 2,
  );
};

export const getSportsCardLeague = (event: PolymarketEvent): SportsCardLeague => {
  const preferredTag = getPreferredTag(event);
  if (preferredTag) {
    const slug = normalizeSlug(preferredTag.slug);
    return {
      slug,
      label: normalizeLabel(slug, preferredTag.label),
    };
  }

  if (event.eventMetadata?.league && typeof event.eventMetadata.league === "string") {
    const slug = normalizeSlug(event.eventMetadata.league);
    return {
      slug,
      label: normalizeLabel(slug, event.eventMetadata.league),
    };
  }

  return {
    slug: "sports",
    label: "Sports",
  };
};

export const buildSportsCards = (
  events: ReadonlyArray<PolymarketEvent>,
  {
    previewLimit,
  }: {
    previewLimit: number;
  },
): SportsCardModel[] =>
  events
    .filter(isSportsCardEvent)
    .map((event) => {
      const previewMarkets = selectPreviewMarkets(event, previewLimit);

      return {
        id: event.id,
        slug: event.slug,
        title: event.title,
        imageSrc: getEventImage(event),
        league: getSportsCardLeague(event),
        volumeLabel: `${formatSportsVolume(getEventVolume(event))} Vol.`,
        totalOutcomeCount: event.markets.length,
        previewOutcomes: previewMarkets.map((market) => ({
          id: market.id,
          label: getPreviewLabel(event, market),
          question: market.question,
          yesTokenId: market.clobTokenIds[0] ?? null,
          noTokenId: market.clobTokenIds[1] ?? null,
          yesFallbackPrice: getMarketYesPrice(market),
          noFallbackPrice: getMarketNoPrice(market),
          volume: getMarketVolume(market),
        })),
        showMoreHref: `/event/${event.slug}`,
        event: {
          ...event,
          markets: previewMarkets,
        },
      };
    })
    .filter((card) => card.previewOutcomes.length > 0)
    .sort(compareCards);

export const selectCardsByLeague = (
  cards: ReadonlyArray<SportsCardModel>,
  leagueSlug: string,
): SportsCardModel[] => {
  const normalizedLeague = normalizeSlug(leagueSlug);
  return cards.filter((card) => card.league.slug === normalizedLeague);
};

export const buildSportsLeagueChips = (
  cards: ReadonlyArray<SportsCardModel>,
  {
    hrefBase,
    activeLeagueSlug,
  }: {
    hrefBase: string;
    activeLeagueSlug?: string;
  },
): SportsLeagueChip[] => {
  const groups = new Map<
    string,
    {
      league: SportsCardLeague;
      cards: SportsCardModel[];
    }
  >();

  for (const card of cards) {
    const existing = groups.get(card.league.slug);
    if (existing) {
      existing.cards.push(card);
      continue;
    }

    groups.set(card.league.slug, {
      league: card.league,
      cards: [card],
    });
  }

  return sortLeagueEntries([...groups.values()]).map(({ league, cards: leagueCards }) => ({
    ...league,
    count: leagueCards.length,
    href: `${hrefBase}/${league.slug}`,
    active: activeLeagueSlug
      ? league.slug === normalizeSlug(activeLeagueSlug)
      : false,
  }));
};

export const buildHydrationEvents = (
  cards: ReadonlyArray<SportsCardModel>,
): PolymarketEvent[] => cards.map((card) => card.event);
