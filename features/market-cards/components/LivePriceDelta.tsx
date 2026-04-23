"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRetainedLivePrice } from "@/features/realtime/hooks";
import { formatPct } from "@/shared/lib/format";
import styles from "./LivePriceDelta.module.css";

const TRANSITION_MS = 1_000;

type DeltaTone = "up" | "down";

type DeltaSnapshot = {
  text: string;
  tone: DeltaTone;
};

type TransitionState = {
  key: number;
  incoming: DeltaSnapshot;
  outgoing: DeltaSnapshot | null;
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

  return {
    text: formatDelta(delta),
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
  const displayRef = useRef<DeltaSnapshot | null>(null);
  const [display, setDisplay] = useState<DeltaSnapshot | null>(null);
  const [transition, setTransition] = useState<TransitionState | null>(null);

  useEffect(() => {
    if (seq <= 0 || !nextSnapshot) {
      return;
    }

    setTransition((current) => ({
      key: seq,
      incoming: nextSnapshot,
      outgoing: current?.incoming ?? displayRef.current,
    }));
    setDisplay(nextSnapshot);
    displayRef.current = nextSnapshot;

    const timeoutId = window.setTimeout(() => {
      setTransition((current) => (current?.key === seq ? null : current));
    }, TRANSITION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [nextSnapshot, seq]);

  if (!display) {
    return null;
  }

  if (!transition) {
    return (
      <span className={styles.static} data-tone={display.tone} aria-hidden="true">
        {display.text}
      </span>
    );
  }

  return (
    <span className={styles.root} aria-hidden="true">
      {transition.outgoing ? (
        <span
          key={`outgoing-${transition.key}`}
          className={`${styles.layer} ${styles.outgoing}`}
          data-tone={transition.outgoing.tone}
        >
          {transition.outgoing.text}
        </span>
      ) : null}
      <span
        key={`incoming-${transition.key}`}
        className={`${styles.layer} ${styles.incoming}`}
        data-tone={transition.incoming.tone}
      >
        {transition.incoming.text}
      </span>
    </span>
  );
}
