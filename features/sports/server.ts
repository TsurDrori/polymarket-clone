import { notFound } from "next/navigation";
import type { PriceHydrationSeed } from "@/features/realtime/Hydrator";
import { getSportsCardWorkingSet } from "./futures/api";
import { getSportsLeagueDashboardPayload, type SportsFuturesLeagueDashboardPayload } from "./futures/dashboardModels";
import {
  getSportsGamesWorkingSet,
  getSportsLiveInitialPageEvents,
} from "./games/api";
import {
  buildHydrationEvents,
  buildSportsCards,
  buildSportsLeagueChips as buildSportsCardLeagueChips,
  selectCardsByLeague,
  type SportsCardModel,
  type SportsLeagueChip as SportsCardLeagueChip,
} from "./futures/parse";
import {
  buildLeagueRouteSections,
  buildLiveRouteSections,
  buildSportsGameRows,
  buildSportsLeagueChips as buildSportsGamesLeagueChips,
  buildSportsPreviewHydrationSeeds,
  selectRowsByLeague,
  type SportsLeagueChip as SportsGamesLeagueChip,
  type SportsbookSectionModel,
} from "./games/parse";

const SPORTS_LIVE_INITIAL_SECTION_LIMIT = 4;
const SPORTS_LEAGUE_INITIAL_SECTION_LIMIT = 6;
const SPORTS_LIVE_INITIAL_HYDRATION_ROW_LIMIT = 8;
const SPORTS_INITIAL_CARD_LIMIT = 12;

export type SportsSectionsPayload = {
  sections: ReadonlyArray<SportsbookSectionModel>;
};

export type SportsLivePagePayload = {
  initialSections: ReadonlyArray<SportsbookSectionModel>;
  hasMoreSections: boolean;
  leagueChips: ReadonlyArray<SportsGamesLeagueChip>;
  hydrationSeeds: ReadonlyArray<PriceHydrationSeed>;
};

export type SportsLeagueGamesPagePayload = {
  initialSections: ReadonlyArray<SportsbookSectionModel>;
  hasMoreSections: boolean;
  leagueChips: ReadonlyArray<SportsGamesLeagueChip>;
  hydrationSeeds: ReadonlyArray<PriceHydrationSeed>;
  normalizedLeague: string;
  title: string;
};

export type SportsLeagueCardsPayload = {
  initialCards: ReadonlyArray<SportsCardModel>;
  cards: ReadonlyArray<SportsCardModel>;
  hasMoreCards: boolean;
  hydrationEvents: ReturnType<typeof buildHydrationEvents>;
  normalizedLeague: string;
  title: string;
  gamesHref: string;
  propsHref: string;
  leagueChips?: ReadonlyArray<SportsCardLeagueChip>;
};

export type SportsFuturesIndexPagePayload = {
  dashboard: SportsFuturesLeagueDashboardPayload;
};

type SportsGamesCatalog = {
  rows: ReturnType<typeof buildSportsGameRows>;
  sections: ReadonlyArray<SportsbookSectionModel>;
};

type SportsLeagueGamesCatalog = {
  allRows: ReturnType<typeof buildSportsGameRows>;
  leagueRows: ReturnType<typeof selectRowsByLeague>;
  sections: ReadonlyArray<SportsbookSectionModel>;
};

type SportsLeagueCardsCatalog = {
  allCards: ReadonlyArray<SportsCardModel>;
  leagueCards: ReadonlyArray<SportsCardModel>;
  normalizedLeague: string;
};

async function getSportsGamesCatalog(): Promise<SportsGamesCatalog> {
  const events = await getSportsGamesWorkingSet();
  const rows = buildSportsGameRows(events);

  return {
    rows,
    sections: buildLiveRouteSections(rows),
  };
}

async function getSportsLeagueGamesCatalog(league: string): Promise<SportsLeagueGamesCatalog> {
  const events = await getSportsGamesWorkingSet({
    desiredLeagueSlug: league,
  });
  const allRows = buildSportsGameRows(events);
  const leagueRows = selectRowsByLeague(allRows, league);

  if (leagueRows.length === 0) {
    notFound();
  }

  return {
    allRows,
    leagueRows,
    sections: buildLeagueRouteSections(leagueRows),
  };
}

async function getSportsLeagueCardsCatalog({
  league,
  surface,
}: {
  league: string;
  surface: "props" | "futures";
}): Promise<SportsLeagueCardsCatalog> {
  const events = await getSportsCardWorkingSet({
    desiredLeagueSlug: league,
  });
  const allCards = buildSportsCards(events, {
    previewLimit: surface === "props" ? 2 : 6,
  });
  const leagueCards = selectCardsByLeague(allCards, league);

  if (leagueCards.length === 0) {
    notFound();
  }

  return {
    allCards,
    leagueCards,
    normalizedLeague: leagueCards[0]!.league.slug,
  };
}

export async function getSportsFuturesIndexPagePayload(): Promise<SportsFuturesIndexPagePayload> {
  return {
    dashboard: await getSportsLeagueFuturesDashboardPayload("nba"),
  };
}

export async function getSportsLeagueFuturesDashboardPayload(
  league: string,
): Promise<SportsFuturesLeagueDashboardPayload> {
  const payload = await getSportsLeagueDashboardPayload(league);

  if (!payload) {
    notFound();
  }

  return payload;
}

export async function getSportsLiveSectionsPayload(): Promise<SportsSectionsPayload> {
  const { sections } = await getSportsGamesCatalog();
  return { sections };
}

export async function getSportsLivePagePayload(): Promise<SportsLivePagePayload> {
  const { events, hasMorePages } = await getSportsLiveInitialPageEvents();
  const rows = buildSportsGameRows(events);
  const sections = buildLiveRouteSections(rows);
  const initialSections = sections.slice(0, SPORTS_LIVE_INITIAL_SECTION_LIMIT);

  return {
    initialSections,
    hasMoreSections:
      hasMorePages || sections.length > initialSections.length,
    leagueChips: buildSportsGamesLeagueChips(rows),
    hydrationSeeds: buildSportsPreviewHydrationSeeds(
      initialSections.flatMap((section) => section.rows),
      { rowLimit: SPORTS_LIVE_INITIAL_HYDRATION_ROW_LIMIT },
    ),
  };
}

export async function getSportsLeagueGamesSectionsPayload(
  league: string,
): Promise<SportsSectionsPayload> {
  const { sections } = await getSportsLeagueGamesCatalog(league);
  return { sections };
}

export async function getSportsLeagueGamesPagePayload(
  league: string,
): Promise<SportsLeagueGamesPagePayload> {
  const { allRows, leagueRows, sections } = await getSportsLeagueGamesCatalog(league);
  const initialSections = sections.slice(0, SPORTS_LEAGUE_INITIAL_SECTION_LIMIT);

  return {
    initialSections,
    hasMoreSections: sections.length > initialSections.length,
    leagueChips: buildSportsGamesLeagueChips(allRows, league),
    hydrationSeeds: buildSportsPreviewHydrationSeeds(
      initialSections.flatMap((section) => section.rows),
      { rowLimit: SPORTS_LIVE_INITIAL_HYDRATION_ROW_LIMIT },
    ),
    normalizedLeague: leagueRows[0]!.league.slug,
    title: leagueRows[0]!.league.label,
  };
}

export async function getSportsLeagueCardCatalogPayload({
  league,
  surface,
}: {
  league: string;
  surface: "props" | "futures";
}): Promise<SportsLeagueCardsPayload> {
  const { allCards, leagueCards, normalizedLeague } = await getSportsLeagueCardsCatalog({
    league,
    surface,
  });

  return {
    initialCards: leagueCards.slice(0, SPORTS_INITIAL_CARD_LIMIT),
    cards: leagueCards,
    hasMoreCards: leagueCards.length > SPORTS_INITIAL_CARD_LIMIT,
    hydrationEvents: buildHydrationEvents(
      leagueCards.slice(0, SPORTS_INITIAL_CARD_LIMIT),
    ),
    normalizedLeague,
    title: leagueCards[0]!.league.label,
    gamesHref: `/sports/${normalizedLeague}/games`,
    propsHref: `/sports/${normalizedLeague}/props`,
    leagueChips:
      surface === "futures"
        ? buildSportsCardLeagueChips(allCards, {
            hrefBase: "/sports/futures",
            activeLeagueSlug: normalizedLeague,
          })
        : undefined,
  };
}
