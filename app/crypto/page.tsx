import type { Metadata } from "next";
import { CryptoSurfaceRoute } from "@/features/crypto/components/CryptoSurfaceRoute";
import { getCryptoPagePayload } from "@/features/crypto/server";
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
  const payload = await getCryptoPagePayload(searchParams);

  return (
    <main className={styles.main}>
      <CryptoSurfaceRoute
        totalCount={payload.totalCount}
        cards={payload.cards}
        hydrationSeeds={payload.hydrationSeeds}
        initialFilters={payload.initialFilters}
        initialVisibleCount={payload.initialVisibleCount}
        visibleIncrement={payload.visibleIncrement}
      />
    </main>
  );
}
