import { getEventImage } from "@/features/events/api/parse";
import type { PolymarketEvent, PolymarketMarket } from "@/features/events/types";
import { formatEndDate, formatVolume } from "@/shared/lib/format";
import { getVisibleTags } from "@/shared/lib/tags";

type EventCardTone = "yes" | "no";

type EventCardActionModel = {
  tone: EventCardTone;
  label: string;
  tokenId?: string;
  fallbackPrice: number;
};

type EventCardBinaryModel = {
  kind: "binary";
  probabilityTokenId?: string;
  probabilityFallback: number;
  actions: [EventCardActionModel, EventCardActionModel];
};

type EventCardGroupedRowModel = {
  id: string;
  label: string;
  probabilityTokenId?: string;
  probabilityFallback: number;
  actions: [EventCardActionModel, EventCardActionModel];
};

type EventCardGroupedModel = {
  kind: "grouped";
  rows: EventCardGroupedRowModel[];
};

type EventCardBodyModel = EventCardBinaryModel | EventCardGroupedModel;

type EventCardFamily = EventCardBodyModel["kind"];

type EventCardViewModel = {
  family: EventCardFamily;
  href: string;
  title: string;
  imageSrc: string;
  metaLabels: string[];
  footerLeading: string;
  footerTrailing?: string;
  footerTrailingTone?: "default" | "live";
  body: EventCardBodyModel;
};

const getOutcomeLabel = (market: PolymarketMarket, index: number): string => {
  const fallback = index === 0 ? "Yes" : "No";
  return market.outcomes[index] || fallback;
};

const getOutcomePrice = (market: PolymarketMarket, index: number): number => {
  const directPrice = market.outcomePrices[index];

  if (Number.isFinite(directPrice)) {
    return directPrice;
  }

  if (index === 0) {
    return market.lastTradePrice;
  }

  if (Number.isFinite(market.lastTradePrice)) {
    return Math.max(0, Math.min(1, 1 - market.lastTradePrice));
  }

  return 0;
};

const buildActionModel = (
  market: PolymarketMarket,
  index: number,
): EventCardActionModel => ({
  tone: index === 0 ? "yes" : "no",
  label: getOutcomeLabel(market, index),
  tokenId: market.clobTokenIds[index],
  fallbackPrice: getOutcomePrice(market, index),
});

const isListableMarket = (market: PolymarketMarket): boolean =>
  market.question.length > 0 &&
  getOutcomeLabel(market, 0).length > 0 &&
  getOutcomeLabel(market, 1).length > 0;

const buildGroupedRows = (
  event: PolymarketEvent,
): EventCardGroupedRowModel[] => {
  // Preserve source order so date and threshold ladders stay semantically correct.
  return event.markets.filter(isListableMarket).slice(0, 2).map((market) => ({
    id: market.id,
    label: market.groupItemTitle || market.question,
    probabilityTokenId: market.clobTokenIds[0],
    probabilityFallback: getOutcomePrice(market, 0),
    actions: [buildActionModel(market, 0), buildActionModel(market, 1)],
  }));
};

export const resolveEventCardFamily = (event: PolymarketEvent): EventCardFamily => {
  if (event.showAllOutcomes && buildGroupedRows(event).length > 0) {
    return "grouped";
  }

  return "binary";
};

const buildBodyModel = (event: PolymarketEvent): EventCardBodyModel => {
  const family = resolveEventCardFamily(event);

  if (family === "grouped") {
    return {
      kind: "grouped",
      rows: buildGroupedRows(event),
    };
  }

  const market = event.markets[0];

  return {
    kind: "binary",
    probabilityTokenId: market?.clobTokenIds[0],
    probabilityFallback: market ? getOutcomePrice(market, 0) : 0,
    actions: market
      ? [buildActionModel(market, 0), buildActionModel(market, 1)]
      : [
          { tone: "yes", label: "Yes", fallbackPrice: 0 },
          { tone: "no", label: "No", fallbackPrice: 0 },
        ],
  };
};

const buildMetaLabels = (event: PolymarketEvent): string[] =>
  getVisibleTags(event)
    .map((tag) => tag.label)
    .filter((label) => label.length > 0)
    .slice(0, 2);

const buildFooter = (event: PolymarketEvent): Pick<
  EventCardViewModel,
  "footerLeading" | "footerTrailing" | "footerTrailingTone"
> => {
  if (event.live) {
    return {
      footerLeading: `${formatVolume(event.volume)} Vol.`,
      footerTrailing: "Live",
      footerTrailingTone: "live",
    };
  }

  if (event.endDate) {
    const label = formatEndDate(event.endDate);

    if (label.length > 0) {
      return {
        footerLeading: `${formatVolume(event.volume)} Vol.`,
        footerTrailing: `Ends ${label}`,
        footerTrailingTone: "default",
      };
    }
  }

  return {
    footerLeading: `${formatVolume(event.volume)} Vol.`,
    footerTrailingTone: "default",
  };
};

export const buildEventCardModel = (event: PolymarketEvent): EventCardViewModel => {
  const footer = buildFooter(event);

  return {
    family: resolveEventCardFamily(event),
    href: `/event/${event.slug}`,
    title: event.title,
    imageSrc: getEventImage(event) ?? "/placeholder.svg",
    metaLabels: buildMetaLabels(event),
    body: buildBodyModel(event),
    ...footer,
  };
};
