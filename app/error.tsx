"use client";

import { useEffect } from "react";
import { RouteFeedback } from "@/shared/ui/RouteFeedback";

type ErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function Error({ error, unstable_retry }: ErrorProps) {
  useEffect(() => {
    console.error("[home]", error);
  }, [error]);

  return (
    <RouteFeedback
      role="alert"
      title="Something went wrong"
      message="This route failed to render. Retry the request or jump back to a top-level market surface."
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
