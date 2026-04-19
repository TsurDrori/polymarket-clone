import type { PolymarketEvent, PolymarketMarket } from "@/features/events/types";
import { hasTagSlug } from "@/shared/lib/tags";

export type SportsLeague = {
  slug: string;
  label: string;
};

const LEAGUE_PRIORITY: readonly SportsLeague[] = [
  { slug: "nba", label: "NBA" },
  { slug: "mlb", label: "MLB" },
  { slug: "soccer", label: "Soccer" },
  { slug: "EPL", label: "EPL" },
  { slug: "nhl", label: "NHL" },
  { slug: "nfl", label: "NFL" },
  { slug: "league-of-legends", label: "League of Legends" },
  { slug: "counter-strike-2", label: "Counter-Strike 2" },
  { slug: "dota-2", label: "Dota 2" },
  { slug: "tennis", label: "Tennis" },
  { slug: "formula1", label: "Formula 1" },
  { slug: "esports", label: "Esports" },
] as const;

const YES_NO_OUTCOMES = new Set(["yes", "no"]);
const OVER_UNDER_OUTCOMES = new Set(["over", "under", "o", "u"]);

const normalize = (value: string): string => value.trim().toLowerCase();

const getDescriptor = (market: PolymarketMarket): string =>
  `${market.groupItemTitle ?? ""} ${market.question}`.trim();

const getNormalizedOutcomes = (market: PolymarketMarket): string[] =>
  market.outcomes.map(normalize);

const isYesNoMarket = (market: PolymarketMarket): boolean =>
  market.outcomes.length === 2 &&
  getNormalizedOutcomes(market).every((outcome) => YES_NO_OUTCOMES.has(outcome));

const isSpreadMarket = (market: PolymarketMarket): boolean =>
  /(spread|handicap|[+-]\d+(?:\.\d+)?)/i.test(getDescriptor(market));

const isTotalMarket = (market: PolymarketMarket): boolean => {
  const outcomes = getNormalizedOutcomes(market);
  return (
    /(o\/u|over\/under|total)/i.test(getDescriptor(market)) ||
    outcomes.every((outcome) => OVER_UNDER_OUTCOMES.has(outcome))
  );
};

const isMoneylineMarket = (market: PolymarketMarket): boolean =>
  market.outcomes.length >= 2 &&
  !isYesNoMarket(market) &&
  !isSpreadMarket(market) &&
  !isTotalMarket(market);

export const isSportsGameEvent = (event: PolymarketEvent): boolean =>
  hasTagSlug(event, "games") || / vs\.? /i.test(event.title);

export const isSportsFutureEvent = (event: PolymarketEvent): boolean =>
  hasTagSlug(event, "sports") && !isSportsGameEvent(event);

export const getSportsLeague = (event: PolymarketEvent): SportsLeague => {
  for (const league of LEAGUE_PRIORITY) {
    if (hasTagSlug(event, league.slug)) return league;
  }

  const fallbackTag = event.tags.find(
    (tag) =>
      tag.slug !== "sports" &&
      tag.slug !== "games" &&
      tag.slug !== "hide-from-new",
  );

  return {
    slug: fallbackTag?.slug ?? "sports",
    label: fallbackTag?.label ?? "Sports",
  };
};

export const pickMoneylineMarket = (
  event: PolymarketEvent,
): PolymarketMarket | undefined => event.markets.find(isMoneylineMarket);

export const pickSpreadMarket = (
  event: PolymarketEvent,
): PolymarketMarket | undefined => event.markets.find(isSpreadMarket);

export const pickTotalMarket = (
  event: PolymarketEvent,
): PolymarketMarket | undefined => event.markets.find(isTotalMarket);

export const extractLineValue = (market: PolymarketMarket): number | null => {
  const match = getDescriptor(market).match(/([+-]?\d+(?:\.\d+)?)/);
  if (!match) return null;

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
};

export const getSpreadOutcomeLabel = (
  market: PolymarketMarket,
  index: number,
): string => {
  const outcome = market.outcomes[index] ?? "";
  const line = extractLineValue(market);

  if (line === null) return outcome;

  const signedLine = index === 0 ? line : -line;
  const prefix = signedLine > 0 ? "+" : "";
  return `${outcome} ${prefix}${signedLine}`;
};

export const getTotalOutcomeLabel = (
  market: PolymarketMarket,
  index: number,
): string => {
  const outcome = market.outcomes[index] ?? "";
  const line = extractLineValue(market);

  if (line === null) return outcome;

  const shortOutcome = /over/i.test(outcome) || index === 0 ? "O" : "U";
  return `${shortOutcome} ${line}`;
};
