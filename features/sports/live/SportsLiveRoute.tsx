"use client";

import type {
  SportsLeagueChip,
  SportsbookSectionModel,
} from "@/features/sports/games/parse";
import { useDeferredCollection } from "@/shared/lib/useDeferredCollection";
import { SportsLiveSurface } from "./SportsLiveSurface";

type SportsLiveRouteProps = {
  title: string;
  description: string;
  leagueChips: ReadonlyArray<SportsLeagueChip>;
  initialSections: ReadonlyArray<SportsbookSectionModel>;
  activeLeagueSlug?: string;
  leagueTabs?: {
    gamesHref: string;
    propsHref: string;
  };
  catalogEndpoint?: string;
};

export function SportsLiveRoute({
  title,
  description,
  leagueChips,
  initialSections,
  activeLeagueSlug,
  leagueTabs,
  catalogEndpoint,
}: SportsLiveRouteProps) {
  const { items: sections } = useDeferredCollection<SportsbookSectionModel>({
    endpoint: catalogEndpoint,
    initialItems: initialSections,
    preload: false,
    selectItems: (payload) =>
      payload && typeof payload === "object" && "sections" in payload
        ? (((payload as { sections?: ReadonlyArray<SportsbookSectionModel> }).sections ??
            initialSections) as ReadonlyArray<SportsbookSectionModel>)
        : initialSections,
  });

  return (
    <SportsLiveSurface
      title={title}
      description={description}
      leagueChips={leagueChips}
      sections={sections}
      activeLeagueSlug={activeLeagueSlug}
      leagueTabs={leagueTabs}
    />
  );
}
