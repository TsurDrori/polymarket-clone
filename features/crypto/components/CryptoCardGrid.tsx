"use client";

import { useEffect, useMemo, useState } from "react";
import { ContinuationButton } from "@/shared/ui/ContinuationButton";
import { CryptoCard } from "./CryptoCard";
import styles from "./CryptoCardGrid.module.css";
import type { CryptoCardModel } from "../parse";

type CryptoCardGridProps = {
  cards: ReadonlyArray<CryptoCardModel>;
  initialCount?: number;
  incrementCount?: number;
  continuationLabel?: string;
};

export function CryptoCardGrid({
  cards,
  initialCount,
  incrementCount,
  continuationLabel = "Show more markets",
}: CryptoCardGridProps) {
  const canPaginate =
    typeof initialCount === "number" &&
    initialCount > 0 &&
    typeof incrementCount === "number" &&
    incrementCount > 0 &&
    cards.length > initialCount;
  const [visibleCount, setVisibleCount] = useState(
    canPaginate ? initialCount : cards.length,
  );
  useEffect(() => {
    setVisibleCount(canPaginate ? initialCount : cards.length);
  }, [canPaginate, cards.length, initialCount]);
  const visibleCards = useMemo(
    () => cards.slice(0, canPaginate ? visibleCount : cards.length),
    [canPaginate, cards, visibleCount],
  );
  const hasMore = canPaginate && visibleCount < cards.length;

  return (
    <div className={styles.stack}>
      <div className={styles.grid}>
        {visibleCards.map((card) => (
          <CryptoCard key={card.id} card={card} />
        ))}
      </div>

      {hasMore ? (
        <div className={styles.actionRow}>
          <ContinuationButton
            onClick={() =>
              setVisibleCount((count) =>
                Math.min(cards.length, count + (incrementCount ?? cards.length)),
              )
            }
          >
            {continuationLabel}
          </ContinuationButton>
        </div>
      ) : null}
    </div>
  );
}
