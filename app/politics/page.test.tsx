import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PolymarketEvent } from "@/features/events/types";

const {
  listEvents,
  CategoryPage,
  Hydrator,
  collectTrendingTopics,
  isEventVisible,
} = vi.hoisted(() => ({
  listEvents: vi.fn(),
  CategoryPage: vi.fn(() => null),
  Hydrator: vi.fn(() => null),
  collectTrendingTopics: vi.fn(),
  isEventVisible: vi.fn(),
}));

vi.mock("@/features/events/api/gamma", () => ({
  listEvents,
}));

vi.mock("@/features/categories/CategoryPage", () => ({
  CategoryPage,
}));

vi.mock("@/features/realtime/Hydrator", () => ({
  Hydrator,
}));

vi.mock("@/features/home/selectors", () => ({
  collectTrendingTopics,
}));

vi.mock("@/shared/lib/tags", () => ({
  isEventVisible,
}));

import PoliticsPage, { revalidate } from "./page";

describe("PoliticsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps the route on a 30-second revalidation window", () => {
    expect(revalidate).toBe(30);
  });

  it("filters hidden events and derives politics facets from visible markets", async () => {
    const visibleEvent = {
      id: "event-visible",
      title: "Visible politics event",
    } as PolymarketEvent;
    const hiddenEvent = {
      id: "event-hidden",
      title: "Hidden politics event",
    } as PolymarketEvent;
    const events = [visibleEvent, hiddenEvent];

    listEvents.mockResolvedValue(events);
    isEventVisible.mockImplementation((event: PolymarketEvent) => event.id === "event-visible");
    collectTrendingTopics.mockReturnValue([
      {
        slug: "trump",
        label: "Trump",
        eventCount: 4,
      },
    ]);

    render(await PoliticsPage());

    expect(listEvents).toHaveBeenCalledWith({
      tagSlug: "politics",
      limit: 18,
      order: "volume_24hr",
      ascending: false,
    });
    expect(Hydrator).toHaveBeenCalledWith(
      {
        events: [visibleEvent],
      },
      undefined,
    );
    expect(collectTrendingTopics).toHaveBeenCalledWith([visibleEvent], 10);
    expect(CategoryPage).toHaveBeenCalledWith(
      expect.objectContaining({
        eyebrow: "Politics",
        title: "Politics",
        events: [visibleEvent],
        facets: [
          {
            slug: "trump",
            label: "Trump",
            meta: "4 markets",
          },
        ],
        initialEventCount: 18,
        eventIncrement: 18,
      }),
      undefined,
    );
  });
});
