"use client";

import { Hydrator } from "@/features/realtime/Hydrator";
import type { PolymarketEvent } from "@/features/events/types";
import type { SportsCardModel, SportsLeagueChip } from "./parse";
import { useDeferredCollection } from "@/shared/lib/useDeferredCollection";
import { SportsFuturesSurface } from "./SportsFuturesSurface";

type SportsLeagueFuturesRouteProps = {
  title: string;
  description: string;
  leagueChips: ReadonlyArray<SportsLeagueChip>;
  initialCards: ReadonlyArray<SportsCardModel>;
  hydrationEvents: ReadonlyArray<PolymarketEvent>;
  activeLeagueSlug: string;
  emptyTitle: string;
  emptyCopy: string;
  catalogEndpoint?: string;
};

export function SportsLeagueFuturesRoute({
  title,
  description,
  leagueChips,
  initialCards,
  hydrationEvents,
  activeLeagueSlug,
  emptyTitle,
  emptyCopy,
  catalogEndpoint,
}: SportsLeagueFuturesRouteProps) {
  const { items: cards } = useDeferredCollection<SportsCardModel>({
    endpoint: catalogEndpoint,
    initialItems: initialCards,
    selectItems: (payload) =>
      payload && typeof payload === "object" && "cards" in payload
        ? (((payload as { cards?: ReadonlyArray<SportsCardModel> }).cards ??
            initialCards) as ReadonlyArray<SportsCardModel>)
        : initialCards,
  });

  return (
    <>
      <Hydrator events={hydrationEvents} />
      <SportsFuturesSurface
        title={title}
        description={description}
        leagueChips={leagueChips}
        cards={cards}
        activeLeagueSlug={activeLeagueSlug}
        emptyTitle={emptyTitle}
        emptyCopy={emptyCopy}
      />
    </>
  );
}
