import { memo } from "react";
import { BinaryGroupCard } from "@/features/market-cards/components/BinaryGroupCard";
import { BinaryWidgetCard } from "@/features/market-cards/components/BinaryWidgetCard";
import type { PolymarketEvent } from "@/features/events/types";
import { buildEventCardModel } from "./eventCardModel";

type EventCardProps = {
  event: PolymarketEvent;
};

function EventCardInner({ event }: EventCardProps) {
  const model = buildEventCardModel(event);
  if (model.body.kind === "grouped") {
    return (
      <BinaryGroupCard
        title={model.title}
        href={model.href}
        imageSrc={model.imageSrc}
        rows={model.body.rows.map((row) => ({
          id: row.id,
          label: row.label,
          probabilityTokenId: row.probabilityTokenId,
          probabilityFallback: row.probabilityFallback,
          actions: row.actions.map((action) => ({
            label: action.label,
            tone: action.tone,
          })) as [typeof row.actions[number], typeof row.actions[number]],
        }))}
        volumeLabel={model.footerLeading}
        metaLabel={model.footerTrailingTone === "live" ? undefined : model.footerTrailing}
        showLiveDot={model.footerTrailingTone === "live"}
      />
    );
  }

  return (
    <BinaryWidgetCard
      title={model.title}
      href={model.href}
      imageSrc={model.imageSrc}
      probability={{
        price: model.body.probabilityFallback,
        tokenId: model.body.probabilityTokenId,
        label: "chance",
      }}
      actions={model.body.actions.map((action) => ({
        label: action.label,
        tone: action.tone,
      })) as [typeof model.body.actions[number], typeof model.body.actions[number]]}
      footerVolume={model.footerLeading}
      footerTrailing={
        model.footerTrailingTone === "live" ? undefined : model.footerTrailing
      }
      showLiveDot={model.footerTrailingTone === "live"}
      liveLabel="Live"
    />
  );
}

EventCardInner.displayName = "EventCard";

export const EventCard = memo(EventCardInner);
