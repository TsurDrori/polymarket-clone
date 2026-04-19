"use client";

import { useEffect } from "react";
import styles from "./error.module.css";

type ErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function Error({ error, unstable_retry }: ErrorProps) {
  useEffect(() => {
    console.error("[home]", error);
  }, [error]);

  return (
    <main className={styles.wrap}>
      <div role="alert" className={styles.card}>
        <h2 className={styles.title}>Couldn&apos;t load markets</h2>
        <p className={styles.message}>
          The Polymarket feed didn&apos;t respond. This is usually transient.
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
