import { memo } from "react";
import type { PolymarketEvent } from "@/features/events/types";
import { BinaryBody } from "./BinaryBody";
import { CardShell } from "./CardShell";
import { MultiOutcomeBody } from "./MultiOutcomeBody";
import { buildEventCardModel } from "./eventCardModel";

type EventCardProps = {
  event: PolymarketEvent;
};

function EventCardInner({ event }: EventCardProps) {
  const model = buildEventCardModel(event);
  const body =
    model.body.kind === "grouped" ? (
      <MultiOutcomeBody model={model.body} />
    ) : (
      <BinaryBody model={model.body} />
    );

  return (
    <CardShell
      family={model.family}
      title={model.title}
      imageSrc={model.imageSrc}
      metaLabels={model.metaLabels}
      footerLeading={model.footerLeading}
      footerTrailing={model.footerTrailing}
      footerTrailingTone={model.footerTrailingTone}
      href={model.href}
    >
      {body}
    </CardShell>
  );
}

EventCardInner.displayName = "EventCard";

export const EventCard = memo(EventCardInner);
