import { getEventBySlug } from "@/features/events/api/gamma";
import { getEventImage } from "@/features/events/api/parse";
import type {
  PolymarketEvent,
  PolymarketMarket,
} from "@/features/events/types";
import { formatSportsPct } from "@/shared/lib/format";
import {
  SPORTS_FUTURES_FEATURED_LEAGUES,
  SPORTS_FUTURES_GROUP_SECTIONS,
  getNBAIdentity,
  getSportsFuturesLeagueSpec,
  type SportsFuturesCardRole,
} from "./leagueDashboardSpec";
import { formatCompactCount, getSportsFuturesPopularCounts } from "./liveContract";

export type SportsFuturesLeagueSidebarItem = {
  slug: string;
  label: string;
  countLabel: string;
  href: string;
  active?: boolean;
};

export type SportsFuturesLeagueSidebarSection = {
  title: string;
  items: ReadonlyArray<SportsFuturesLeagueSidebarItem>;
};

export type SportsFuturesLeaguePill = {
  slug: string;
  label: string;
  href: string;
  active?: boolean;
};

export type SportsFuturesDashboardOutcome = {
  id: string;
  label: string;
  shortLabel: string;
  probability: number;
  probabilityLabel: string;
  tokenId: string | null;
  accentColor: string;
};

export type SportsFuturesDashboardCard = {
  id: string;
  slug: string;
  title: string;
  role: SportsFuturesCardRole;
  imageSrc: string | null;
  outcomes: ReadonlyArray<SportsFuturesDashboardOutcome>;
  hiddenOutcomeCount: number;
  href: string;
  event: PolymarketEvent;
};

export type SportsFuturesLeagueDashboardPayload = {
  league: string;
  title: string;
  sidebarFeatured: ReadonlyArray<SportsFuturesLeagueSidebarItem>;
  sidebarSections: ReadonlyArray<SportsFuturesLeagueSidebarSection>;
  pills: ReadonlyArray<SportsFuturesLeaguePill>;
  heroCard: SportsFuturesDashboardCard;
  compactCards: ReadonlyArray<SportsFuturesDashboardCard>;
  barCards: ReadonlyArray<SportsFuturesDashboardCard>;
  hydrationEvents: ReadonlyArray<PolymarketEvent>;
};

const FUTURES_CARD_RAIL_COUNT_KEYS = new Set(["nba"]);

const getMarketProbability = (market: PolymarketMarket): number => {
  const rawOutcome = Number(market.outcomePrices[0] ?? market.lastTradePrice ?? 0);
  if (!Number.isFinite(rawOutcome)) return 0;
  return Math.max(0, Math.min(1, rawOutcome));
};

const getMarketVolume = (market: PolymarketMarket): number =>
  market.volume24hr > 0 ? market.volume24hr : market.volumeNum;

const compareMarketsForDashboard = (
  left: PolymarketMarket,
  right: PolymarketMarket,
): number =>
  getMarketProbability(right) - getMarketProbability(left) ||
  getMarketVolume(right) - getMarketVolume(left) ||
  (left.groupItemTitle ?? left.question).localeCompare(right.groupItemTitle ?? right.question);

const getOutcomeLabel = (market: PolymarketMarket): string =>
  market.groupItemTitle?.trim() || market.question.trim();

const buildOutcomeModel = (market: PolymarketMarket): SportsFuturesDashboardOutcome => {
  const label = getOutcomeLabel(market);
  const identity = getNBAIdentity(label);
  const probability = getMarketProbability(market);

  return {
    id: market.id,
    label: identity.label,
    shortLabel: identity.shortLabel,
    probability,
    probabilityLabel: formatSportsPct(probability),
    tokenId: market.clobTokenIds[0] ?? null,
    accentColor: identity.accentColor,
  };
};

const buildCardModel = ({
  event,
  title,
  role,
  maxVisibleOutcomes,
}: {
  event: PolymarketEvent;
  title: string;
  role: SportsFuturesCardRole;
  maxVisibleOutcomes: number;
}): SportsFuturesDashboardCard => {
  const sortedMarkets = [...event.markets]
    .filter((market) => market.clobTokenIds.length >= 2)
    .sort(compareMarketsForDashboard);
  const visibleMarkets = sortedMarkets.slice(0, maxVisibleOutcomes);

  return {
    id: event.id,
    slug: event.slug,
    title,
    role,
    imageSrc: getEventImage(event),
    outcomes: visibleMarkets.map(buildOutcomeModel),
    hiddenOutcomeCount: Math.max(sortedMarkets.length - visibleMarkets.length, 0),
    href: `/event/${event.slug}`,
    event: {
      ...event,
      markets: visibleMarkets,
    },
  };
};

const buildSidebarItem = ({
  slug,
  label,
  count,
  active,
}: {
  slug: string;
  label: string;
  count: number;
  active?: boolean;
}): SportsFuturesLeagueSidebarItem => ({
  slug,
  label,
  countLabel: formatCompactCount(count),
  href: `/sports/futures/${slug}`,
  active,
});

const collectLeagueCount = (
  counts: Record<string, number>,
  key: string,
): number => (FUTURES_CARD_RAIL_COUNT_KEYS.has(key) ? counts[key] ?? 0 : 0);

export async function getSportsLeagueDashboardPayload(
  league: string,
): Promise<SportsFuturesLeagueDashboardPayload | null> {
  const spec = getSportsFuturesLeagueSpec(league);
  if (!spec) {
    return null;
  }

  const counts = await getSportsFuturesPopularCounts();
  const events = await Promise.all(spec.cards.map((cardSpec) => getEventBySlug(cardSpec.slug)));
  const eventsBySlug = new Map(events.map((event) => [event.slug, event]));

  const cards = spec.cards.map((cardSpec) => {
    const event = eventsBySlug.get(cardSpec.slug);
    if (!event) {
      throw new Error(`Missing sports futures event: ${cardSpec.slug}`);
    }

    return buildCardModel({
      event,
      title: cardSpec.title,
      role: cardSpec.role,
      maxVisibleOutcomes: cardSpec.maxVisibleOutcomes,
    });
  });

  const heroCard = cards.find((card) => card.role === "hero");
  if (!heroCard) {
    throw new Error(`Missing hero card spec for ${spec.league}`);
  }

  return {
    league: spec.league,
    title: spec.routeTitle,
    sidebarFeatured: SPORTS_FUTURES_FEATURED_LEAGUES.map((item) =>
      buildSidebarItem({
        slug: item.slug,
        label: item.label,
        count: collectLeagueCount(counts, item.countKey),
        active: item.slug === spec.league,
      }),
    ),
    sidebarSections: SPORTS_FUTURES_GROUP_SECTIONS.map((section) => ({
      title: section.title,
      items: section.items.map((item) =>
        buildSidebarItem({
          slug: item.slug,
          label: item.label,
          count: collectLeagueCount(counts, item.countKey),
          active: item.slug === spec.league,
        }),
      ),
    })),
    pills: spec.pills.map((pill) => ({
      slug: pill.slug,
      label: pill.label,
      href: `/sports/futures/${pill.slug}`,
      active: pill.slug === spec.league,
    })),
    heroCard,
    compactCards: cards.filter((card) => card.role === "compact-list"),
    barCards: cards.filter((card) => card.role === "bar"),
    hydrationEvents: cards.map((card) => card.event),
  };
}
