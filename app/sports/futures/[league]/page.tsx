import type { Metadata } from "next";
import { Hydrator } from "@/features/realtime/Hydrator";
import { formatSportsLeagueLabel } from "@/features/sports/leagueLabel";
import { getSportsCardWorkingSet } from "@/features/sports/futures/api";
import {
  buildHydrationEvents,
  buildSportsCards,
  buildSportsLeagueChips,
  selectCardsByLeague,
} from "@/features/sports/futures/parse";
import { SportsFuturesSurface } from "@/features/sports/futures/SportsFuturesSurface";
import { notFound } from "next/navigation";
import styles from "./page.module.css";

export async function generateMetadata(
  props: PageProps<"/sports/futures/[league]">,
): Promise<Metadata> {
  const { league } = await props.params;
  const leagueLabel = formatSportsLeagueLabel(league);

  return {
    title: `${leagueLabel} Futures Trading Odds & Predictions 2026 | Polymarket`,
    description: `${leagueLabel} outrights and season-long futures cards presented inside the clone's canonical sports futures route family.`,
  };
}

export default async function SportsLeagueFuturesPage(
  props: PageProps<"/sports/futures/[league]">,
) {
  const { league } = await props.params;
  const events = await getSportsCardWorkingSet({
    desiredLeagueSlug: league,
  });
  const cards = buildSportsCards(events, {
    previewLimit: 6,
  });
  const leagueCards = selectCardsByLeague(cards, league);

  if (leagueCards.length === 0) {
    notFound();
  }

  const normalizedLeague = leagueCards[0]!.league.slug;
  const leagueChips = buildSportsLeagueChips(cards, {
    hrefBase: "/sports/futures",
    activeLeagueSlug: normalizedLeague,
  });

  return (
    <main className={styles.main}>
      <Hydrator events={buildHydrationEvents(leagueCards)} />
      <SportsFuturesSurface
        title={leagueCards[0]!.league.label}
        description="Season-long and non-game sports markets shown as stacked futures cards with bounded live previews."
        leagueChips={leagueChips}
        cards={leagueCards}
        activeLeagueSlug={normalizedLeague}
        emptyTitle="No results found"
        emptyCopy="This league does not currently expose any futures cards in the public sports feed."
      />
    </main>
  );
}
