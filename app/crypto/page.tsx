import type { Metadata } from "next";
import { Suspense } from "react";
import {
  buildCryptoWorkingSet,
  buildHydrationEvents,
  parseCryptoSearchParams,
} from "@/features/crypto/parse";
import { CryptoSurfaceRoute } from "@/features/crypto/components/CryptoSurfaceRoute";
import { CryptoSurfaceSkeleton } from "@/features/crypto/components/CryptoSurfaceSkeleton";
import { listEventsKeyset } from "@/features/events/api/gamma";
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
      limit: 200,
      order: "volume24hr",
      ascending: false,
    }),
    searchParams,
  ]);
  const workingSet = buildCryptoWorkingSet(events);
  const hydrationEvents = buildHydrationEvents(workingSet.cards);
  const initialFilters = parseCryptoSearchParams(query);

  return (
    <main className={styles.main}>
      <Suspense fallback={<CryptoSurfaceSkeleton />}>
        <CryptoSurfaceRoute
          totalCount={workingSet.cards.length}
          workingSet={workingSet}
          hydrationEvents={hydrationEvents}
          initialFilters={initialFilters}
          initialVisibleCount={18}
          visibleIncrement={18}
        />
      </Suspense>
    </main>
  );
}
