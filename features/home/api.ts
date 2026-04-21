import type { PolymarketEvent } from "@/features/events/types";

type HomeChipFeedResponse = {
  events: PolymarketEvent[];
  nextCursor: string | null;
};

export async function fetchHomeChipFeed(
  chipSlug: string,
  cursor?: string | null,
  signal?: AbortSignal,
): Promise<HomeChipFeedResponse> {
  const params = new URLSearchParams({ chip: chipSlug });
  if (cursor) {
    params.set("cursor", cursor);
  }
  const response = await fetch(`/api/home-chip-feed?${params.toString()}`, {
    method: "GET",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to load ${chipSlug} feed`);
  }

  return (await response.json()) as HomeChipFeedResponse;
}
