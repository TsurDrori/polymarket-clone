import { listEventsKeyset } from "@/features/events/api/gamma";
import type { PolymarketEvent } from "@/features/events/types";
import { getSportsCardLeague, isSportsCardEvent } from "./parse";

const SPORTS_TAG_SLUG = "sports";
const PAGE_LIMIT = 50;
const ALL_SURFACE_MIN_PAGES = 3;
const ALL_SURFACE_MAX_PAGES = 6;
const LEAGUE_SURFACE_MIN_PAGES = 2;
const LEAGUE_SURFACE_MAX_PAGES = 6;
const LEAGUE_TAG_MIN_PAGES = 1;
const LEAGUE_TAG_MAX_PAGES = 2;
const TARGET_BASE_LEAGUE_COUNT = 16;
const TARGET_LEAGUE_CARD_COUNT = 12;

const normalizeLeagueSlug = (value: string): string =>
  value.trim().toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-|-$/g, "");

const countLeagueCards = (
  events: ReadonlyArray<PolymarketEvent>,
  desiredLeagueSlug: string,
): number =>
  events.filter((event) => {
    if (!isSportsCardEvent(event)) return false;
    return getSportsCardLeague(event).slug === normalizeLeagueSlug(desiredLeagueSlug);
  }).length;

const countSurfaceLeagues = (events: ReadonlyArray<PolymarketEvent>): number =>
  new Set(
    events
      .filter(isSportsCardEvent)
      .map((event) => getSportsCardLeague(event).slug),
  ).size;

// Gamma currently marks the parent "sports" taxonomy tag as force-hidden even
// for markets that still appear on public sports routes, so route validity
// cannot rely on tag-level visibility flags here.
const isVisibleSportsCardEvent = (): boolean => true;

const hasSatisfiedWorkingSet = (
  events: ReadonlyArray<PolymarketEvent>,
  desiredLeagueSlug?: string,
): boolean => {
  if (desiredLeagueSlug) {
    return countLeagueCards(events, desiredLeagueSlug) >= TARGET_LEAGUE_CARD_COUNT;
  }

  return countSurfaceLeagues(events) >= TARGET_BASE_LEAGUE_COUNT;
};

const collectWorkingSet = async ({
  events,
  seen,
  tagSlug,
  minimumPages,
  maximumPages,
  desiredLeagueSlug,
}: {
  events: PolymarketEvent[];
  seen: Set<string>;
  tagSlug: string;
  minimumPages: number;
  maximumPages: number;
  desiredLeagueSlug?: string;
}): Promise<number> => {
  let cursor: string | undefined;
  let pageCount = 0;

  while (pageCount < maximumPages) {
    const { events: pageEvents, nextCursor } = await listEventsKeyset({
      tagSlug,
      limit: PAGE_LIMIT,
      order: "volume24hr",
      ascending: false,
      afterCursor: cursor,
    });
    pageCount += 1;

    for (const event of pageEvents) {
      if (seen.has(event.id)) continue;
      seen.add(event.id);

      if (!isVisibleSportsCardEvent()) continue;
      events.push(event);
    }

    if (!nextCursor) break;

    if (pageCount >= minimumPages && hasSatisfiedWorkingSet(events, desiredLeagueSlug)) {
      break;
    }

    cursor = nextCursor;
  }

  return pageCount;
};

export async function getSportsCardWorkingSet({
  desiredLeagueSlug,
}: {
  desiredLeagueSlug?: string;
} = {}): Promise<PolymarketEvent[]> {
  const events: PolymarketEvent[] = [];
  const seen = new Set<string>();
  const normalizedDesiredLeagueSlug = desiredLeagueSlug
    ? normalizeLeagueSlug(desiredLeagueSlug)
    : undefined;

  if (!normalizedDesiredLeagueSlug) {
    await collectWorkingSet({
      events,
      seen,
      tagSlug: SPORTS_TAG_SLUG,
      minimumPages: ALL_SURFACE_MIN_PAGES,
      maximumPages: ALL_SURFACE_MAX_PAGES,
    });

    return events;
  }

  const targetedPages = await collectWorkingSet({
    events,
    seen,
    tagSlug: normalizedDesiredLeagueSlug,
    minimumPages: LEAGUE_TAG_MIN_PAGES,
    maximumPages: LEAGUE_TAG_MAX_PAGES,
    desiredLeagueSlug: normalizedDesiredLeagueSlug,
  });

  if (hasSatisfiedWorkingSet(events, normalizedDesiredLeagueSlug)) {
    return events;
  }

  const remainingPages = LEAGUE_SURFACE_MAX_PAGES - targetedPages;
  if (remainingPages <= 0) {
    return events;
  }

  await collectWorkingSet({
    events,
    seen,
    tagSlug: SPORTS_TAG_SLUG,
    minimumPages: Math.max(0, LEAGUE_SURFACE_MIN_PAGES - targetedPages),
    maximumPages: remainingPages,
    desiredLeagueSlug: normalizedDesiredLeagueSlug,
  });

  return events;
}
