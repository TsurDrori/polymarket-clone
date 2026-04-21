import {
  listEventsKeyset,
  type ListEventsKeysetParams,
  type ListEventsKeysetResult,
} from "@/features/events/api/gamma";
import type { PolymarketEvent } from "@/features/events/types";
import { isEventVisible } from "@/shared/lib/tags";

export const HOME_CHIP_EVENT_LIMIT = 24;

export const buildHomeChipFeedParams = (
  chipSlug: string,
  afterCursor?: string,
): ListEventsKeysetParams => ({
  limit: HOME_CHIP_EVENT_LIMIT,
  order: "volume_24hr",
  ascending: false,
  ...(afterCursor ? { afterCursor } : {}),
  ...(chipSlug === "all" ? {} : { tagSlug: chipSlug }),
});

export const getHomeChipFeedEvents = async (
  chipSlug: string,
  afterCursor?: string,
): Promise<ListEventsKeysetResult> => {
  const page = await listEventsKeyset(buildHomeChipFeedParams(chipSlug, afterCursor));

  return {
    events: page.events.filter(isEventVisible),
    nextCursor: page.nextCursor,
  };
};
