"use client";

import { memo } from "react";
import { useRouter } from "next/navigation";
import type { PolymarketEvent } from "@/features/events/types";
import { BinaryBody } from "./BinaryBody";
import { CardShell } from "./CardShell";
import { MultiOutcomeBody } from "./MultiOutcomeBody";

type EventCardProps = {
  event: PolymarketEvent;
};

function EventCardInner({ event }: EventCardProps) {
  const router = useRouter();
  const href = `/event/${event.slug}`;

  const handleNavigate = () => {
    router.push(href);
  };

  const primaryMarket = event.markets[0];
  const body =
    event.showAllOutcomes && event.markets.length > 1 ? (
      <MultiOutcomeBody markets={event.markets} onNavigate={handleNavigate} />
    ) : primaryMarket ? (
      <BinaryBody market={primaryMarket} onNavigate={handleNavigate} />
    ) : null;

  return (
    <CardShell event={event} href={href}>
      {body}
    </CardShell>
  );
}

EventCardInner.displayName = "EventCard";

export const EventCard = memo(EventCardInner);
