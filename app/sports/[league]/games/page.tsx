import { notFound } from "next/navigation";
import { SportsRowsHydrator } from "@/features/sports/games/SportsRowsHydrator";
import { getSportsGamesWorkingSet } from "@/features/sports/games/api";
import {
  buildLeagueRouteSections,
  buildSportsGameRows,
  buildSportsLeagueChips,
  buildSportsPreviewHydrationSeeds,
  selectRowsByLeague,
} from "@/features/sports/games/parse";
import { SportsLiveSurface } from "@/features/sports/live/SportsLiveSurface";
import styles from "./page.module.css";

type SportsLeagueGamesPageProps = {
  params: Promise<{
    league: string;
  }>;
};

export default async function SportsLeagueGamesPage({
  params,
}: SportsLeagueGamesPageProps) {
  const { league } = await params;
  const events = await getSportsGamesWorkingSet({
    desiredLeagueSlug: league,
  });
  const rows = buildSportsGameRows(events);
  const leagueRows = selectRowsByLeague(rows, league);

  if (leagueRows.length === 0) {
    notFound();
  }

  const sections = buildLeagueRouteSections(leagueRows);
  const hydrationSeeds = buildSportsPreviewHydrationSeeds(
    sections.flatMap((section) => section.rows),
  );
  const leagueChips = buildSportsLeagueChips(rows, league);
  const leagueTitle = leagueRows[0]?.league.label ?? "League";
  const normalizedLeague = leagueRows[0]?.league.slug ?? league;

  return (
    <main className={styles.main}>
      <SportsRowsHydrator seeds={hydrationSeeds} />
      <SportsLiveSurface
        title={leagueTitle}
        description="League-specific games feed with live sportsbook rows."
        leagueChips={leagueChips}
        sections={sections}
        activeLeagueSlug={normalizedLeague}
        leagueTabs={{
          gamesHref: `/sports/${normalizedLeague}/games`,
          propsHref: `/sports/${normalizedLeague}/props`,
        }}
      />
    </main>
  );
}
