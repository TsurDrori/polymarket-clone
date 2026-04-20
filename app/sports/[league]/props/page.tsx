import type { Metadata } from "next";
import { formatSportsLeagueLabel } from "@/features/sports/leagueLabel";
import { Hydrator } from "@/features/realtime/Hydrator";
import { SportsLeaguePropsRoute } from "@/features/sports/props/SportsLeaguePropsRoute";
import { SportsPropsSurface } from "@/features/sports/props/SportsPropsSurface";
import { getSportsLeagueCardCatalogPayload } from "@/features/sports/server";
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
  const payload = await getSportsLeagueCardCatalogPayload({
    league,
    surface: "props",
  }).catch(() => null);

  if (!payload) {
    notFound();
  }

  return (
    <main className={styles.main}>
      <Hydrator events={payload.hydrationEvents} />
      {payload.hasMoreCards ? (
        <SportsLeaguePropsRoute
          title={payload.title}
          description="League props and futures-style cards sourced from the public sports feed, with Games linking back into the sportsbook-row route family."
          gamesHref={payload.gamesHref}
          propsHref={payload.propsHref}
          initialCards={payload.initialCards}
          catalogEndpoint={`/api/sports-card-catalog?league=${encodeURIComponent(payload.normalizedLeague)}&surface=props`}
        />
      ) : (
        <>
          <SportsPropsSurface
            title={payload.title}
            description="League props and futures-style cards sourced from the public sports feed, with Games linking back into the sportsbook-row route family."
            gamesHref={payload.gamesHref}
            propsHref={payload.propsHref}
            cards={payload.initialCards}
          />
        </>
      )}
    </main>
  );
}
