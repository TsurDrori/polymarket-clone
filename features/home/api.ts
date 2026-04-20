import type { PolymarketEvent } from "@/features/events/types";

type HomeChipFeedResponse = {
  events: PolymarketEvent[];
};

export async function fetchHomeChipFeed(
  chipSlug: string,
  signal?: AbortSignal,
): Promise<PolymarketEvent[]> {
  const params = new URLSearchParams({ chip: chipSlug });
  const response = await fetch(`/api/home-chip-feed?${params.toString()}`, {
    method: "GET",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to load ${chipSlug} feed`);
  }

  const payload = (await response.json()) as HomeChipFeedResponse;
  return payload.events;
}
