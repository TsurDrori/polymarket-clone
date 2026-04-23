"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRetainedLivePrice } from "@/features/realtime/hooks";
import { formatPct } from "@/shared/lib/format";
import styles from "./LivePriceDelta.module.css";

const TRANSITION_MS = 2800;

type DeltaTone = "up" | "down";

type DeltaSnapshot = {
  text: string;
  tone: DeltaTone;
};

type TransitionState = {
  key: number;
  snapshot: DeltaSnapshot;
};

const formatDelta = (value: number): string =>
  `${value > 0 ? "+" : "-"}${formatPct(Math.abs(value))}`;

const buildSnapshot = (
  price: number,
  prevPrice: number,
  ts: number,
): DeltaSnapshot | null => {
  if (ts <= 1 || prevPrice <= 0 || price === prevPrice) {
    return null;
  }

  const delta = price - prevPrice;
  const formattedText = formatDelta(delta);

  if (formattedText === "+0%" || formattedText === "-0%") {
    return null;
  }

  return {
    text: formattedText,
    tone: delta > 0 ? "up" : "down",
  };
};

export function LivePriceDelta({ tokenId }: { tokenId: string }) {
  const {
    tick,
    flash: { seq },
  } = useRetainedLivePrice(tokenId);
  const nextSnapshot = useMemo(
    () => buildSnapshot(tick.price, tick.prevPrice, tick.ts),
    [tick.prevPrice, tick.price, tick.ts],
  );
  const seenSeqRef = useRef(seq);
  const [transition, setTransition] = useState<TransitionState | null>(null);

  useEffect(() => {
    if (seq <= seenSeqRef.current || !nextSnapshot) {
      return;
    }

    seenSeqRef.current = seq;

    setTransition({
      key: seq,
      snapshot: nextSnapshot,
    });

    const timeoutId = window.setTimeout(() => {
      setTransition((current) => (current?.key === seq ? null : current));
    }, TRANSITION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [nextSnapshot, seq]);

  if (!transition) {
    return null;
  }

  return (
    <span
      className={styles.root}
      data-direction={transition.snapshot.tone}
      aria-hidden="true"
    >
      <span
        key={`delta-${transition.key}`}
        className={styles.badge}
        data-tone={transition.snapshot.tone}
      >
        {transition.snapshot.text}
      </span>
    </span>
  );
}
