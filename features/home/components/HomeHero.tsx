"use client";

import { useEffect, useState } from "react";
import type { HomeHeroModel } from "../selectors";
import { HeroFooterNav } from "./HeroFooterNav";
import { HeroRightRail } from "./HeroRightRail";
import { HeroSpotlightCard } from "./HeroSpotlightCard";
import styles from "./HomeHero.module.css";

type HomeHeroProps = {
  hero: HomeHeroModel;
};

const getInitialSpotlightIndex = (
  spotlights: ReadonlyArray<HomeHeroModel["spotlights"][number]>,
): number =>
  spotlights.reduce(
    (bestIndex, spotlight, index, allSpotlights) => {
      const currentScore =
        Number(Boolean(spotlight.chart)) +
        (1 - Math.min(1, Math.abs(spotlight.market.question.length - 56) / 56));
      const bestSpotlight = allSpotlights[bestIndex];
      const bestScore =
        Number(Boolean(bestSpotlight?.chart)) +
        (1 -
          Math.min(1, Math.abs((bestSpotlight?.market.question.length ?? 56) - 56) / 56));

      return currentScore > bestScore ? index : bestIndex;
    },
    0,
  );

export function HomeHero({ hero }: HomeHeroProps) {
  const [activeIndex, setActiveIndex] = useState(() =>
    getInitialSpotlightIndex(hero.spotlights),
  );
  const [isPaused, setIsPaused] = useState(false);
  const hasSpotlights = hero.spotlights.length > 0;
  const hasMultipleSpotlights = hero.spotlights.length > 1;
  const safeActiveIndex = hasSpotlights
    ? Math.min(activeIndex, hero.spotlights.length - 1)
    : 0;
  const activeSpotlight = hero.spotlights[safeActiveIndex] ?? hero.spotlight;

  const selectIndex = (index: number) => {
    if (!hasMultipleSpotlights) return;

    const total = hero.spotlights.length;
    setActiveIndex((index + total) % total);
  };

  useEffect(() => {
    if (!hasMultipleSpotlights || isPaused) {
      return;
    }

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % hero.spotlights.length);
    }, 8_000);

    return () => window.clearInterval(intervalId);
  }, [hasMultipleSpotlights, hero.spotlights.length, isPaused]);

  if (!hero.spotlight || !hasSpotlights || !activeSpotlight) {
    return null;
  }

  return (
    <section
      id="trending"
      className={styles.desktopHero}
      aria-label="Homepage spotlight"
    >
      <div className={styles.heroRow}>
        <div
          className={styles.spotlightColumn}
          data-spotlight-column
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={() => setIsPaused(false)}
        >
          <HeroSpotlightCard key={activeSpotlight.market.id} spotlight={activeSpotlight} />
          <HeroFooterNav
            spotlights={hero.spotlights}
            activeIndex={safeActiveIndex}
            onSelect={selectIndex}
          />
        </div>
        <HeroRightRail hero={hero} />
      </div>
    </section>
  );
}
