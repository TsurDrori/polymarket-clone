import type { Metadata } from "next";
import { buildSportsLeagueChips } from "@/features/sports/futures/parse";
import { SportsFuturesSurface } from "@/features/sports/futures/SportsFuturesSurface";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Sports Futures Prediction Markets & Live Odds 2026 | Polymarket",
  description:
    "Season-long sports futures cards with league rails and the same empty aggregate-state contract the live site exposes.",
};

export default function SportsFuturesPage() {
  const leagueChips = buildSportsLeagueChips([], {
    hrefBase: "/sports/futures",
  });

  return (
    <main className={styles.main}>
      <SportsFuturesSurface
        title="Futures"
        description="Public sports futures mode with league navigation, sort chrome, and the same empty-result behavior Polymarket currently shows on the base route."
        leagueChips={leagueChips}
        cards={[]}
        emptyTitle="No results found"
        emptyCopy="Polymarket’s public /sports/futures index currently resolves to an empty state, so this route mirrors that live behavior instead of inventing a custom aggregate feed."
      />
    </main>
  );
}
