"use client";

import { useState } from "react";
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
  const hasMultipleSpotlights = hero.spotlights.length > 1;

  if (!hero.spotlight || hero.spotlights.length === 0) {
    return null;
  }

  const safeActiveIndex = Math.min(activeIndex, hero.spotlights.length - 1);
  const activeSpotlight = hero.spotlights[safeActiveIndex] ?? hero.spotlight;

  const selectIndex = (index: number) => {
    if (!hasMultipleSpotlights) return;

    const total = hero.spotlights.length;
    setActiveIndex((index + total) % total);
  };

  return (
    <section
      id="trending"
      className={styles.desktopHero}
      aria-label="Homepage spotlight"
    >
      <div className={styles.heroRow}>
        <div className={styles.spotlightColumn}>
          <HeroSpotlightCard spotlight={activeSpotlight} />
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
