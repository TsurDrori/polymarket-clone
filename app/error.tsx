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
        <h2 className={styles.title}>Something went wrong</h2>
        <p className={styles.message}>
          This route failed to render. Retry the request or jump back to a top-level
          market surface.
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
