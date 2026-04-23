import type { Metadata } from "next";
import { listEvents, listEventsKeyset } from "@/features/events/api/gamma";
import { HomePage } from "@/features/home/HomePage";
import { getHomeChipFeedEvents, HOME_CHIP_EVENT_LIMIT } from "@/features/home/chipFeed";
import {
  buildHomeExploreCardEntries,
} from "@/features/home/components/homeCardModel";
import {
  buildHomePageModel,
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

const HOME_TOP_EVENT_SEED_LIMIT = 8;
const HOME_INITIAL_EXPLORE_LIMIT = HOME_CHIP_EVENT_LIMIT;
const HOME_POLITICS_SEED_TAG = "united-states";
const HOME_WORLD_SEED_TAG = "world";
const HOME_SECTOR_SEED_LIMIT = 6;

export const metadata: Metadata = {
  title: "Polymarket | The World's Largest Prediction Market™",
  description:
    "Featured prediction markets and the broadest live market feed across the clone's core surfaces.",
};

export default async function Home() {
  const [
    topFeed,
    allMarketsFeed,
    politicsEvents,
    worldEvents,
    cryptoEvents,
    sportsEvents,
    cryptoCatalog,
    sportsGameEvents,
  ] =
    await Promise.all([
    listEventsKeyset({
      limit: HOME_TOP_EVENT_SEED_LIMIT,
      order: "volume_24hr",
      ascending: false,
      revalidate: 30,
    }),
    getHomeChipFeedEvents("all"),
    listEvents({
      limit: HOME_SECTOR_SEED_LIMIT,
      order: "volume_24hr",
      ascending: false,
      tagSlug: HOME_POLITICS_SEED_TAG,
    }),
    listEvents({
      limit: HOME_SECTOR_SEED_LIMIT,
      order: "volume_24hr",
      ascending: false,
      tagSlug: HOME_WORLD_SEED_TAG,
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
      limit: 120,
      order: "volume24hr",
      ascending: false,
      tagSlug: "up-or-down",
      revalidate: 30,
    }),
    getHomeSportsGamePreviewEvents(6),
  ]);

  const visible = [
    ...topFeed.events,
    ...politicsEvents,
    ...worldEvents,
    ...cryptoEvents,
    ...sportsEvents,
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

  const model = buildHomePageModel(visible, {
    exploreLimit: HOME_INITIAL_EXPLORE_LIMIT,
  });
  const initialExploreEvents = allMarketsFeed.events.filter(isEventVisible);
  const initialExploreCards = buildHomeExploreCardEntries({
    events: initialExploreEvents,
    cryptoEvents: cryptoCatalog.events,
    sportsEvents: sportsGameEvents.filter((event) => event.teams.length >= 2),
    limit: HOME_INITIAL_EXPLORE_LIMIT,
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
      <HomePage
        model={model}
        initialExploreCards={initialExploreCards}
        initialExploreCursor={allMarketsFeed.nextCursor}
      />
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
