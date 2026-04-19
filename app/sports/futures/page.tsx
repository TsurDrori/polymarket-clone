import { getSportsCardWorkingSet } from "@/features/sports/futures/api";
import {
  buildSportsCards,
  buildSportsLeagueChips,
} from "@/features/sports/futures/parse";
import { SportsFuturesSurface } from "@/features/sports/futures/SportsFuturesSurface";
import styles from "./page.module.css";

export default async function SportsFuturesPage() {
  const events = await getSportsCardWorkingSet();
  const cards = buildSportsCards(events, {
    previewLimit: 6,
  });
  const leagueChips = buildSportsLeagueChips(cards, {
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
