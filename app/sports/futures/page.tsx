import type { Metadata } from "next";
import { SportsFuturesDiscovery } from "@/features/sports/futures/SportsFuturesDiscovery";
import { SportsFuturesAggregateRoute } from "@/features/sports/futures/SportsFuturesAggregateRoute";
import { getSportsFuturesIndexPagePayload } from "@/features/sports/server";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Sports Futures Prediction Markets & Live Odds 2026 | Polymarket",
  description:
    "Season-long sports futures cards with league rails and the same empty aggregate-state contract the live site exposes.",
};

export default async function SportsFuturesPage() {
  const { allCountLabel, railItems } = await getSportsFuturesIndexPagePayload();

  return (
    <main className={styles.main}>
      <SportsFuturesAggregateRoute allCountLabel={allCountLabel} railItems={railItems} />
      <SportsFuturesDiscovery />
    </main>
  );
}
