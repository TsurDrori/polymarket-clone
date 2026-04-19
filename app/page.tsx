import type { Metadata } from "next";
import { getMarketPriceHistory } from "@/features/events/api/clob";
import { listEvents } from "@/features/events/api/gamma";
import { HomePage } from "@/features/home/HomePage";
import {
  buildHomePageModel,
  selectSpotlightEvents,
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
  const [topEvents, cryptoEvents, economyEvents, cultureEvents, worldEvents] =
    await Promise.all([
    listEvents({
      limit: 30,
      order: "volume_24hr",
      ascending: false,
    }),
    listEvents({
      limit: 6,
      tagSlug: "crypto",
    }),
    listEvents({
      limit: 6,
      tagSlug: "economy",
    }),
    listEvents({
      limit: 6,
      tagSlug: "pop-culture",
    }),
    listEvents({
      limit: 6,
      tagSlug: "world",
    }),
  ]);

  const visible = [
    ...topEvents,
    ...cryptoEvents,
    ...economyEvents,
    ...cultureEvents,
    ...worldEvents,
  ].filter(
    (event, index, allEvents) =>
      isEventVisible(event) &&
      allEvents.findIndex((candidate) => candidate.id === event.id) === index,
  );

  if (visible.length === 0) {
    return (
      <main className={styles.main}>
        <p className={styles.empty}>No markets to show right now.</p>
      </main>
    );
  }

  const spotlightChartsEntries = await Promise.all(
    selectSpotlightEvents(visible, 5).map(async (event) => {
      const market = selectSpotlightMarket(event);
      const tokenId = market?.clobTokenIds[0];

      if (!market || !tokenId) {
        return null;
      }

      try {
        const points = await getMarketPriceHistory({
          tokenId,
          interval: "1w",
          fidelity: 60,
        });

        return [
          market.id,
          points.length >= 5
            ? {
                points,
                intervalLabel: "Monthly",
                sourceLabel: "Polymarket",
              }
            : null,
        ] as const;
      } catch {
        return [market.id, null] as const;
      }
    }),
  );

  const spotlightCharts = Object.fromEntries(
    spotlightChartsEntries.filter(
      (entry): entry is readonly [string, HeroChartModel | null] => Boolean(entry),
    ),
  );

  const model = buildHomePageModel(visible, { spotlightCharts });

  return (
    <main className={styles.main}>
      <Hydrator events={visible} />
      <HomePage model={model} />
    </main>
  );
}
