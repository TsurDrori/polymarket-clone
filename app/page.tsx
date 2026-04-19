import type { Metadata } from "next";
import { getMarketPriceHistory } from "@/features/events/api/clob";
import { listEvents } from "@/features/events/api/gamma";
import { HomePage } from "@/features/home/HomePage";
import {
  buildHomePageModel,
  selectSpotlightEvent,
  selectSpotlightMarket,
  type HeroChartModel,
} from "@/features/home/selectors";
import { Hydrator } from "@/features/realtime/Hydrator";
import { isEventVisible } from "@/shared/lib/tags";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Polymarket | The World's Largest Prediction Market™",
  description:
    "Featured prediction markets, breaking movers, and the broadest live market feed across the clone's core surfaces.",
};

export default async function Home() {
  const events = await listEvents({
    limit: 30,
    order: "volume_24hr",
    ascending: false,
  });
  const visible = events.filter(isEventVisible);

  if (visible.length === 0) {
    return (
      <main className={styles.main}>
        <p className={styles.empty}>No markets to show right now.</p>
      </main>
    );
  }

  const spotlightEvent = selectSpotlightEvent(visible);
  const spotlightMarket = spotlightEvent
    ? selectSpotlightMarket(spotlightEvent)
    : undefined;
  const spotlightTokenId = spotlightMarket?.clobTokenIds[0];
  let spotlightChart: HeroChartModel | null = null;

  if (spotlightTokenId) {
    try {
      const points = await getMarketPriceHistory({
        tokenId: spotlightTokenId,
        interval: "1w",
        fidelity: 60,
      });

      if (points.length >= 5) {
        spotlightChart = {
          points,
          intervalLabel: "1W window",
          sourceLabel: "Polymarket CLOB",
        };
      }
    } catch {
      spotlightChart = null;
    }
  }

  const model = buildHomePageModel(visible, { spotlightChart });

  return (
    <main className={styles.main}>
      <Hydrator events={visible} />
      <HomePage model={model} />
    </main>
  );
}
