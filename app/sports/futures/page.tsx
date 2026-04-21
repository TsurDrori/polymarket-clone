import type { Metadata } from "next";
import { Hydrator } from "@/features/realtime/Hydrator";
import { NBA_LEAGUE_DISCOVERY_CONTENT } from "@/features/sports/futures/leagueDiscoveryContent";
import { SportsFuturesDiscovery } from "@/features/sports/futures/SportsFuturesDiscovery";
import { SportsLeagueFuturesDashboard } from "@/features/sports/futures/SportsLeagueFuturesDashboard";
import { getSportsFuturesIndexPagePayload } from "@/features/sports/server";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Sports Futures Prediction Markets & Live Odds 2026 | Polymarket",
  description:
    "Season-long sports futures charts, league outrights, and the graph-first dashboard layout seen on Polymarket.",
};

export default async function SportsFuturesPage() {
  const { dashboard } = await getSportsFuturesIndexPagePayload();

  return (
    <main className={styles.main}>
      <Hydrator events={dashboard.hydrationEvents} />
      <SportsLeagueFuturesDashboard payload={dashboard} rootHref="/sports/futures" />
      <SportsFuturesDiscovery
        brandLabel="Polymarket"
        brandTitle="The World's Largest Prediction Market™"
        brandCopy="Explore the biggest sports outrights, championship boards, and conference markets after the featured futures dashboard."
        content={NBA_LEAGUE_DISCOVERY_CONTENT}
      />
    </main>
  );
}
