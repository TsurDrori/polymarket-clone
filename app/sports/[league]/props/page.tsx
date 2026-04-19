import type { Metadata } from "next";
import { Hydrator } from "@/features/realtime/Hydrator";
import { getSportsCardWorkingSet } from "@/features/sports/futures/api";
import {
  buildHydrationEvents,
  buildSportsCards,
  selectCardsByLeague,
} from "@/features/sports/futures/parse";
import { formatSportsLeagueLabel } from "@/features/sports/leagueLabel";
import { SportsPropsSurface } from "@/features/sports/props/SportsPropsSurface";
import { notFound } from "next/navigation";
import styles from "./page.module.css";

export async function generateMetadata(
  props: PageProps<"/sports/[league]/props">,
): Promise<Metadata> {
  const { league } = await props.params;
  const leagueLabel = formatSportsLeagueLabel(league);

  return {
    title: `${leagueLabel} Props Trading Odds & Predictions 2026 | Polymarket`,
    description: `${leagueLabel} props-style cards with canonical games and props route switching inside the shared sports shell.`,
  };
}

export default async function SportsLeaguePropsPage(
  props: PageProps<"/sports/[league]/props">,
) {
  const { league } = await props.params;
  const events = await getSportsCardWorkingSet({
    desiredLeagueSlug: league,
  });
  const cards = buildSportsCards(events, {
    previewLimit: 2,
  });
  const leagueCards = selectCardsByLeague(cards, league);

  if (leagueCards.length === 0) {
    notFound();
  }

  const normalizedLeague = leagueCards[0]!.league.slug;

  return (
    <main className={styles.main}>
      <Hydrator events={buildHydrationEvents(leagueCards)} />
      <SportsPropsSurface
        title={leagueCards[0]!.league.label}
        description="League props and futures-style cards sourced from the public sports feed, with Games linking back into the sportsbook-row route family."
        gamesHref={`/sports/${normalizedLeague}/games`}
        propsHref={`/sports/${normalizedLeague}/props`}
        cards={leagueCards}
      />
    </main>
  );
}
