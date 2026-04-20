"use client";

import { Hydrator } from "@/features/realtime/Hydrator";
import type { PolymarketEvent } from "@/features/events/types";
import type { SportsCardModel } from "@/features/sports/futures/parse";
import { useDeferredCollection } from "@/shared/lib/useDeferredCollection";
import { SportsPropsSurface } from "./SportsPropsSurface";

type SportsLeaguePropsRouteProps = {
  title: string;
  description: string;
  gamesHref: string;
  propsHref: string;
  initialCards: ReadonlyArray<SportsCardModel>;
  hydrationEvents: ReadonlyArray<PolymarketEvent>;
  catalogEndpoint?: string;
};

export function SportsLeaguePropsRoute({
  title,
  description,
  gamesHref,
  propsHref,
  initialCards,
  hydrationEvents,
  catalogEndpoint,
}: SportsLeaguePropsRouteProps) {
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
      <SportsPropsSurface
        title={title}
        description={description}
        gamesHref={gamesHref}
        propsHref={propsHref}
        cards={cards}
      />
    </>
  );
}
