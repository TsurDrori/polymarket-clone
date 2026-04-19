"use client";

import { memo } from "react";
import type { PolymarketEvent } from "@/features/events/types";
import { BinaryBody } from "./BinaryBody";
import { CardShell } from "./CardShell";
import { MultiOutcomeBody } from "./MultiOutcomeBody";

type EventCardProps = {
  event: PolymarketEvent;
};

function EventCardInner({ event }: EventCardProps) {
  const primaryMarket = event.markets[0];
  const body =
    event.showAllOutcomes && event.markets.length > 1 ? (
      <MultiOutcomeBody markets={event.markets} />
    ) : primaryMarket ? (
      <BinaryBody market={primaryMarket} />
    ) : null;

  return <CardShell event={event}>{body}</CardShell>;
}

EventCardInner.displayName = "EventCard";

export const EventCard = memo(EventCardInner);
