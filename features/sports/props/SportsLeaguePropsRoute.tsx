"use client";

import type { HomeCardEntry } from "@/features/home/components/homeCardModel";
import { useDeferredCollection } from "@/shared/lib/useDeferredCollection";
import { SportsPropsSurface } from "./SportsPropsSurface";

type SportsLeaguePropsRouteProps = {
  title: string;
  description: string;
  gamesHref: string;
  propsHref: string;
  initialItems: ReadonlyArray<HomeCardEntry>;
  catalogEndpoint?: string;
};

export function SportsLeaguePropsRoute({
  title,
  description,
  gamesHref,
  propsHref,
  initialItems,
  catalogEndpoint,
}: SportsLeaguePropsRouteProps) {
  const { items } = useDeferredCollection<HomeCardEntry>({
    endpoint: catalogEndpoint,
    initialItems,
    selectItems: (payload) =>
      payload && typeof payload === "object" && "items" in payload
        ? (((payload as { items?: ReadonlyArray<HomeCardEntry> }).items ??
            initialItems) as ReadonlyArray<HomeCardEntry>)
        : initialItems,
  });

  return (
    <SportsPropsSurface
      title={title}
      description={description}
      gamesHref={gamesHref}
      propsHref={propsHref}
      items={items}
    />
  );
}
