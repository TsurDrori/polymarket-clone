import {
  listEventsKeyset,
  type ListEventsKeysetParams,
  type ListEventsKeysetResult,
} from "@/features/events/api/gamma";
import { isEventVisible } from "@/shared/lib/tags";

export const HOME_CHIP_EVENT_LIMIT = 20;
const HOME_CHIP_FETCH_MULTIPLIER = 2;
const HOME_CHIP_MAX_BATCH_REQUESTS = 4;

export const buildHomeChipFeedParams = (
  chipSlug: string,
  afterCursor?: string,
): ListEventsKeysetParams => ({
  limit: HOME_CHIP_EVENT_LIMIT * HOME_CHIP_FETCH_MULTIPLIER,
  order: "volume_24hr",
  ascending: false,
  ...(afterCursor ? { afterCursor } : {}),
  ...(chipSlug === "all" ? {} : { tagSlug: chipSlug }),
});

export const getHomeChipFeedEvents = async (
  chipSlug: string,
  afterCursor?: string,
): Promise<ListEventsKeysetResult> => {
  const events: ListEventsKeysetResult["events"] = [];
  const seenIds = new Set<string>();
  let cursor = afterCursor;
  let nextCursor: string | null = null;

  for (let requestIndex = 0; requestIndex < HOME_CHIP_MAX_BATCH_REQUESTS; requestIndex += 1) {
    const page = await listEventsKeyset(buildHomeChipFeedParams(chipSlug, cursor));
    nextCursor = page.nextCursor;

    for (const event of page.events) {
      if (!isEventVisible(event) || seenIds.has(event.id)) {
        continue;
      }

      seenIds.add(event.id);
      events.push(event);

      if (events.length === HOME_CHIP_EVENT_LIMIT) {
        return {
          events,
          nextCursor,
        };
      }
    }

    if (!nextCursor) {
      break;
    }

    cursor = nextCursor;
  }

  return {
    events,
    nextCursor,
  };
};
