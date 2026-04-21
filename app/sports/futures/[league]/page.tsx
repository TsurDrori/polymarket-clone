import type { Metadata } from "next";
import { formatSportsLeagueLabel } from "@/features/sports/leagueLabel";
import { Hydrator } from "@/features/realtime/Hydrator";
import { NBA_LEAGUE_DISCOVERY_CONTENT } from "@/features/sports/futures/leagueDiscoveryContent";
import { SportsFuturesDiscovery } from "@/features/sports/futures/SportsFuturesDiscovery";
import { SportsLeagueFuturesDashboard } from "@/features/sports/futures/SportsLeagueFuturesDashboard";
import { getSportsLeagueFuturesDashboardPayload } from "@/features/sports/server";
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
  const payload = await getSportsLeagueFuturesDashboardPayload(league).catch(() => null);

  if (!payload) {
    notFound();
  }

  return (
    <main className={styles.main}>
      <Hydrator events={payload.hydrationEvents} />
      <SportsLeagueFuturesDashboard payload={payload} />
      <SportsFuturesDiscovery
        brandLabel="Polymarket"
        brandTitle="The World's Largest Prediction Market™"
        brandCopy="Live Polymarket follows the futures dashboard with related sports discovery columns, so the clone keeps the same lower-page rhythm after the curated card grid."
        content={NBA_LEAGUE_DISCOVERY_CONTENT}
      />
    </main>
  );
}
