import type { Metadata } from "next";
import { getMarketPriceHistory } from "@/features/events/api/clob";
import { listEvents, listEventsKeyset } from "@/features/events/api/gamma";
import { HomePage } from "@/features/home/HomePage";
import {
  buildHomeExploreCardEntries,
} from "@/features/home/components/homeCardModel";
import {
  buildHomePageModel,
  HOME_HERO_SPOTLIGHT_LIMIT,
  selectSpotlightEvents,
  selectSpotlightMarket,
  type HeroChartModel,
} from "@/features/home/selectors";
import {
  Hydrator,
} from "@/features/realtime/Hydrator";
import {
  buildHydrationSeedsFromEvents,
  type PriceHydrationSeed,
} from "@/features/realtime/seeds";
import { getHomeSportsGamePreviewEvents } from "@/features/sports/games/api";
import { isEventVisible } from "@/shared/lib/tags";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Polymarket | The World's Largest Prediction Market™",
  description:
    "Featured prediction markets and the broadest live market feed across the clone's core surfaces.",
};

export default async function Home() {
  const [topEvents, cryptoEvents, sportsEvents, cryptoCatalog, sportsGameEvents] =
    await Promise.all([
    listEvents({
      limit: 32,
      order: "volume_24hr",
      ascending: false,
    }),
    listEvents({
      limit: 12,
      order: "volume_24hr",
      ascending: false,
      tagSlug: "crypto",
    }),
    listEvents({
      limit: 12,
      order: "volume_24hr",
      ascending: false,
      tagSlug: "sports",
    }),
    listEventsKeyset({
      limit: 20,
      order: "volume24hr",
      ascending: false,
      tagSlug: "up-or-down",
      revalidate: 30,
    }),
    getHomeSportsGamePreviewEvents(6),
  ]);

  const visible = [...topEvents, ...cryptoEvents, ...sportsEvents].filter(
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
    selectSpotlightEvents(visible, HOME_HERO_SPOTLIGHT_LIMIT).map(async (event) => {
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
  const initialExploreCards = buildHomeExploreCardEntries({
    events: model.exploreEvents,
    cryptoEvents: cryptoCatalog.events,
    sportsEvents: sportsGameEvents.filter((event) => event.teams.length >= 2),
    limit: 24,
  });
  const hydratedEvents = [
    ...(model.hero.spotlights.map((spotlight) => spotlight.event) ?? []),
    ...model.exploreEvents,
  ].filter(
    (event, index, allEvents) =>
      allEvents.findIndex((candidate) => candidate.id === event.id) === index,
  );
  const hydrationSeeds = dedupeHydrationSeeds([
    ...buildHydrationSeedsFromEvents(hydratedEvents),
    ...initialExploreCards.flatMap((entry) => entry.hydrationSeeds),
  ]);

  return (
    <main className={styles.main}>
      <Hydrator seeds={hydrationSeeds} />
      <HomePage model={model} initialExploreCards={initialExploreCards} />
    </main>
  );
}

function dedupeHydrationSeeds(
  seeds: ReadonlyArray<PriceHydrationSeed>,
): PriceHydrationSeed[] {
  const seen = new Map<string, PriceHydrationSeed>();

  for (const seed of seeds) {
    if (!seen.has(seed.tokenId)) {
      seen.set(seed.tokenId, seed);
    }
  }

  return [...seen.values()];
}
