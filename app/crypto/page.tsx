import type { Metadata } from "next";
import {
  buildCryptoWorkingSet,
  getCryptoFilterHref,
  parseCryptoSearchParams,
  resolveCryptoSurfaceState,
} from "@/features/crypto/parse";
import { CryptoSurface } from "@/features/crypto/components/CryptoSurface";
import { listEventsKeyset } from "@/features/events/api/gamma";
import { Hydrator } from "@/features/realtime/Hydrator";
import { redirect } from "next/navigation";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Crypto Odds & Predictions 2026 | Polymarket",
  description:
    "Crypto up/down, range, and target-price markets with client-local filters and a bounded initial visible slice.",
};

type CryptoPageProps = {
  searchParams: Promise<{
    family?: string | string[] | undefined;
    time?: string | string[] | undefined;
    asset?: string | string[] | undefined;
  }>;
};

export default async function CryptoPage({ searchParams }: CryptoPageProps) {
  const [{ events }, query] = await Promise.all([
    listEventsKeyset({
      tagSlug: "crypto",
      limit: 250,
      order: "volume24hr",
      ascending: false,
    }),
    searchParams,
  ]);
  const workingSet = buildCryptoWorkingSet(events);
  const parsedFilters = parseCryptoSearchParams(query);
  const resolved = resolveCryptoSurfaceState(workingSet, parsedFilters);

  if (
    parsedFilters.family !== resolved.filters.family ||
    parsedFilters.time !== resolved.filters.time ||
    parsedFilters.asset !== resolved.filters.asset
  ) {
    redirect(
      getCryptoFilterHref(
        {
          family: "all",
          time: "all",
          asset: "all",
        },
        resolved.filters,
      ),
    );
  }

  return (
    <main className={styles.main}>
      <Hydrator events={resolved.hydrationEvents} />
      <CryptoSurface
        totalCount={workingSet.cards.length}
        facets={resolved.facets}
        filters={resolved.filters}
        cards={resolved.cards}
        initialVisibleCount={18}
        visibleIncrement={18}
      />
    </main>
  );
}
