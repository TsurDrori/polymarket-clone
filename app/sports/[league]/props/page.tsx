import type { Metadata } from "next";
import { formatSportsLeagueLabel } from "@/features/sports/leagueLabel";
import { Hydrator } from "@/features/realtime/Hydrator";
import { SportsLeaguePropsRoute } from "@/features/sports/props/SportsLeaguePropsRoute";
import { SportsPropsSurface } from "@/features/sports/props/SportsPropsSurface";
import { getSportsLeaguePropsPayload } from "@/features/sports/server";
import { notFound } from "next/navigation";
import styles from "./page.module.css";

export async function generateMetadata(
  props: PageProps<"/sports/[league]/props">,
): Promise<Metadata> {
  const { league } = await props.params;
  const leagueLabel = formatSportsLeagueLabel(league);

  return {
    title: `${leagueLabel} Props Trading Odds & Predictions 2026 | Polymarket`,
    description: `${leagueLabel} props markets rendered with the same shared market cards used across the core Polymarket surfaces.`,
  };
}

export default async function SportsLeaguePropsPage(
  props: PageProps<"/sports/[league]/props">,
) {
  const { league } = await props.params;
  const payload = await getSportsLeaguePropsPayload(league).catch(() => null);

  if (!payload) {
    notFound();
  }

  return (
    <main className={styles.main}>
      <Hydrator seeds={payload.hydrationSeeds} />
      {payload.hasMoreItems ? (
        <SportsLeaguePropsRoute
          title={payload.title}
          description="League props markets sourced from the public sports feed, using the same shared card families as the main market grid."
          gamesHref={payload.gamesHref}
          propsHref={payload.propsHref}
          initialItems={payload.initialItems}
          catalogEndpoint={`/api/sports-card-catalog?league=${encodeURIComponent(payload.normalizedLeague)}&surface=props`}
        />
      ) : (
        <>
          <SportsPropsSurface
            title={payload.title}
            description="League props markets sourced from the public sports feed, using the same shared card families as the main market grid."
            gamesHref={payload.gamesHref}
            propsHref={payload.propsHref}
            items={payload.initialItems}
          />
        </>
      )}
    </main>
  );
}
