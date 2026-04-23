import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SportsRowsHydrator } from "@/features/sports/games/SportsRowsHydrator";
import { formatSportsLeagueLabel } from "@/features/sports/leagueLabel";
import { SportsLiveSurface } from "@/features/sports/live/SportsLiveSurface";
import { getSportsLeagueGamesPagePayload } from "@/features/sports/server";
import styles from "./page.module.css";

type SportsLeagueGamesPageProps = {
  params: Promise<{
    league: string;
  }>;
};

export async function generateMetadata({
  params,
}: SportsLeagueGamesPageProps): Promise<Metadata> {
  const { league } = await params;
  const leagueLabel = formatSportsLeagueLabel(league);

  return {
    title: `${leagueLabel} Live Prediction Markets & Live Odds 2026 | Polymarket`,
    description: `${leagueLabel} games rows with moneyline, spread, and total markets under the live sportsbook-style sports surface.`,
  };
}

export default async function SportsLeagueGamesPage({
  params,
}: SportsLeagueGamesPageProps) {
  const { league } = await params;
  const payload = await getSportsLeagueGamesPagePayload(league).catch((error: unknown) => {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as { digest?: unknown }).digest === "string"
    ) {
      throw error;
    }

    notFound();
  });

  if (!payload) {
    notFound();
  }

  return (
    <main className={styles.main}>
      <SportsRowsHydrator seeds={payload.hydrationSeeds} />
      <SportsLiveSurface
        title={payload.title}
        description="League-specific games feed with live sportsbook rows."
        leagueChips={payload.leagueChips}
        sections={payload.initialSections}
        activeLeagueSlug={payload.normalizedLeague}
        leagueTabs={{
          gamesHref: `/sports/${payload.normalizedLeague}/games`,
          propsHref: `/sports/${payload.normalizedLeague}/props`,
        }}
      />
    </main>
  );
}
