"use client";

import { useEffect } from "react";
import styles from "@/app/error.module.css";

type ErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function Error({ error, unstable_retry }: ErrorProps) {
  useEffect(() => {
    console.error("[event-detail]", error);
  }, [error]);

  return (
    <main className={styles.wrap}>
      <div role="alert" className={styles.card}>
        <h2 className={styles.title}>Couldn&apos;t load this market</h2>
        <p className={styles.message}>
          The event detail request failed. Try again to refetch the latest
          market data.
        </p>
        <button
          type="button"
          className={styles.retry}
          onClick={() => unstable_retry()}
        >
          Try again
        </button>
      </div>
    </main>
  );
}
