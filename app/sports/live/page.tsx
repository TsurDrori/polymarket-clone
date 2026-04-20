import type { Metadata } from "next";
import { SportsRowsHydrator } from "@/features/sports/games/SportsRowsHydrator";
import { SportsLiveSurface } from "@/features/sports/live/SportsLiveSurface";
import { getSportsLivePagePayload } from "@/features/sports/server";
import { SportsLiveRoute } from "@/features/sports/live/SportsLiveRoute";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Sports Prediction Markets & Live Odds 2026 | Polymarket",
  description:
    "Live sportsbook-style rows grouped by league and date, with canonical sports routing under the shared shell.",
};

export default async function SportsLivePage() {
  const payload = await getSportsLivePagePayload();

  return (
    <main className={styles.main}>
      {payload.hasMoreSections ? (
        <SportsLiveRoute
          title="Sports Live"
          description="Public games markets grouped into sportsbook-style live sections."
          leagueChips={payload.leagueChips}
          initialSections={payload.initialSections}
          hydrationSeeds={payload.hydrationSeeds}
          catalogEndpoint="/api/sports-sections"
        />
      ) : (
        <>
          <SportsRowsHydrator seeds={payload.hydrationSeeds} />
          <SportsLiveSurface
            title="Sports Live"
            description="Public games markets grouped into sportsbook-style live sections."
            leagueChips={payload.leagueChips}
            sections={payload.initialSections}
          />
        </>
      )}
    </main>
  );
}
