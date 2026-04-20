import type { Metadata } from "next";
import { formatSportsLeagueLabel } from "@/features/sports/leagueLabel";
import { Hydrator } from "@/features/realtime/Hydrator";
import { SportsLeagueFuturesRoute } from "@/features/sports/futures/SportsLeagueFuturesRoute";
import { SportsFuturesSurface } from "@/features/sports/futures/SportsFuturesSurface";
import { getSportsLeagueCardCatalogPayload } from "@/features/sports/server";
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
  const payload = await getSportsLeagueCardCatalogPayload({
    league,
    surface: "futures",
  }).catch(() => null);

  if (!payload) {
    notFound();
  }

  return (
    <main className={styles.main}>
      {payload.hasMoreCards ? (
        <SportsLeagueFuturesRoute
          title={payload.title}
          description="Season-long and non-game sports markets shown as stacked futures cards with bounded live previews."
          leagueChips={payload.leagueChips ?? []}
          initialCards={payload.initialCards}
          hydrationEvents={payload.hydrationEvents}
          activeLeagueSlug={payload.normalizedLeague}
          emptyTitle="No results found"
          emptyCopy="This league does not currently expose any futures cards in the public sports feed."
          catalogEndpoint={`/api/sports-card-catalog?league=${encodeURIComponent(payload.normalizedLeague)}&surface=futures`}
        />
      ) : (
        <>
          <Hydrator events={payload.hydrationEvents} />
          <SportsFuturesSurface
            title={payload.title}
            description="Season-long and non-game sports markets shown as stacked futures cards with bounded live previews."
            leagueChips={payload.leagueChips ?? []}
            cards={payload.initialCards}
            activeLeagueSlug={payload.normalizedLeague}
            emptyTitle="No results found"
            emptyCopy="This league does not currently expose any futures cards in the public sports feed."
          />
        </>
      )}
    </main>
  );
}
