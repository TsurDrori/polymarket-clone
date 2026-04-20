"use client";

import { useEffect } from "react";
import { RouteFeedback } from "@/shared/ui/RouteFeedback";

type ErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function Error({ error, unstable_retry }: ErrorProps) {
  useEffect(() => {
    console.error("[event-detail]", error);
  }, [error]);

  return (
    <RouteFeedback
      role="alert"
      title="Couldn&apos;t load this market"
      message="The event detail request failed. Try again to refetch the latest market data."
    >
        <button
          type="button"
          className="route-feedback__action"
          onClick={() => unstable_retry()}
        >
          Try again
        </button>
    </RouteFeedback>
  );
}
