import { listEventsKeyset } from "@/features/events/api/gamma";
import type { PolymarketEvent } from "@/features/events/types";
import { isEventVisible } from "@/shared/lib/tags";
import { getSportsCardLeague, isSportsCardEvent } from "./parse";

const PAGE_LIMIT = 50;
const ALL_SURFACE_MIN_PAGES = 3;
const ALL_SURFACE_MAX_PAGES = 5;
const LEAGUE_SURFACE_MIN_PAGES = 2;
const LEAGUE_SURFACE_MAX_PAGES = 10;
const TARGET_LEAGUE_CARD_COUNT = 12;

const countLeagueCards = (
  events: ReadonlyArray<PolymarketEvent>,
  desiredLeagueSlug: string,
): number =>
  events.filter((event) => {
    if (!isSportsCardEvent(event)) return false;
    return getSportsCardLeague(event).slug === desiredLeagueSlug;
  }).length;

export async function getSportsCardWorkingSet({
  desiredLeagueSlug,
}: {
  desiredLeagueSlug?: string;
} = {}): Promise<PolymarketEvent[]> {
  const events: PolymarketEvent[] = [];
  const seen = new Set<string>();
  let cursor: string | undefined;
  let pageCount = 0;

  const minimumPages = desiredLeagueSlug
    ? LEAGUE_SURFACE_MIN_PAGES
    : ALL_SURFACE_MIN_PAGES;
  const maximumPages = desiredLeagueSlug
    ? LEAGUE_SURFACE_MAX_PAGES
    : ALL_SURFACE_MAX_PAGES;

  while (pageCount < maximumPages) {
    const { events: pageEvents, nextCursor } = await listEventsKeyset({
      tagSlug: "sports",
      limit: PAGE_LIMIT,
      order: "volume24hr",
      ascending: false,
      afterCursor: cursor,
    });
    pageCount += 1;

    for (const event of pageEvents) {
      if (seen.has(event.id)) continue;
      seen.add(event.id);

      if (!isEventVisible(event) || event.restricted) continue;
      events.push(event);
    }

    if (!nextCursor) break;

    if (pageCount >= minimumPages) {
      if (!desiredLeagueSlug) break;
      if (countLeagueCards(events, desiredLeagueSlug) >= TARGET_LEAGUE_CARD_COUNT) {
        break;
      }
    }

    cursor = nextCursor;
  }

  return events;
}
