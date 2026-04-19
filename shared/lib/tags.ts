import type { PolymarketEvent, PolymarketTag } from "@/features/events/types";

const HIDDEN_SLUGS = new Set(["hide-from-new"]);

export const getVisibleTags = (event: PolymarketEvent): PolymarketTag[] =>
  event.tags.filter(
    (tag) => !tag.forceHide && !HIDDEN_SLUGS.has(tag.slug),
  );

export const hasTagSlug = (event: PolymarketEvent, slug: string): boolean =>
  event.tags.some((tag) => tag.slug === slug);

export const isEventVisible = (event: PolymarketEvent): boolean =>
  event.tags.every((tag) => !HIDDEN_SLUGS.has(tag.slug));
