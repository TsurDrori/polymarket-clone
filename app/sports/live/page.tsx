import { SportsRowsHydrator } from "@/features/sports/games/SportsRowsHydrator";
import { getSportsGamesWorkingSet } from "@/features/sports/games/api";
import {
  buildLiveRouteSections,
  buildSportsGameRows,
  buildSportsLeagueChips,
  buildSportsPreviewHydrationSeeds,
} from "@/features/sports/games/parse";
import { SportsLiveSurface } from "@/features/sports/live/SportsLiveSurface";
import styles from "./page.module.css";

export default async function SportsLivePage() {
  const events = await getSportsGamesWorkingSet();
  const rows = buildSportsGameRows(events);
  const sections = buildLiveRouteSections(rows);
  const hydrationSeeds = buildSportsPreviewHydrationSeeds(
    sections.flatMap((section) => section.rows),
  );
  const leagueChips = buildSportsLeagueChips(rows);

  return (
    <main className={styles.main}>
      <SportsRowsHydrator seeds={hydrationSeeds} />
      <SportsLiveSurface
        title="Sports Live"
        description="Public games markets grouped into sportsbook-style live sections."
        leagueChips={leagueChips}
        sections={sections}
      />
    </main>
  );
}
