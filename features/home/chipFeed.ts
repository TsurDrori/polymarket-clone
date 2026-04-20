import { listEvents, type ListEventsParams } from "@/features/events/api/gamma";
import type { PolymarketEvent } from "@/features/events/types";
import { isEventVisible } from "@/shared/lib/tags";

export const HOME_CHIP_EVENT_LIMIT = 30;

export const buildHomeChipFeedParams = (chipSlug: string): ListEventsParams => ({
  limit: HOME_CHIP_EVENT_LIMIT,
  order: "volume_24hr",
  ascending: false,
  ...(chipSlug === "all" ? {} : { tagSlug: chipSlug }),
});

export const getHomeChipFeedEvents = async (
  chipSlug: string,
): Promise<PolymarketEvent[]> => {
  const events = await listEvents(buildHomeChipFeedParams(chipSlug));
  return events.filter(isEventVisible);
};
