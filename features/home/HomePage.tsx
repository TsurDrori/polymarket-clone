"use client";

import { useMemo, useState } from "react";
import { Bookmark, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import type { HomePageModel } from "./selectors";
import { filterHomeFeedEventsByChip } from "./selectors";
import { CompactHeroDiscovery } from "./components/CompactHeroDiscovery";
import { HomeHero } from "./components/HomeHero";
import { HomeMarketGrid } from "./components/HomeMarketGrid";
import styles from "./HomePage.module.css";

type HomePageProps = {
  model: HomePageModel;
};

export function HomePage({ model }: HomePageProps) {
  const [activeChipSlug, setActiveChipSlug] = useState(
    model.marketChips[0]?.slug ?? "all",
  );
  const filteredEvents = useMemo(
    () => filterHomeFeedEventsByChip(model.exploreEvents, activeChipSlug),
    [activeChipSlug, model.exploreEvents],
  );

  return (
    <div className={styles.root}>
      <HomeHero hero={model.hero} />
      <CompactHeroDiscovery chips={model.hero.contextChips} />

      <section
        id="markets"
        className={styles.marketSection}
        aria-labelledby="markets-heading"
      >
        <div className={styles.sectionHeader}>
          <div>
            <h2 id="markets-heading" className={styles.subheading}>
              All markets
            </h2>
          </div>
          <div className={styles.marketTools}>
            <button type="button" className={styles.toolButton} aria-label="Search markets">
              <Search size={18} />
            </button>
            <button type="button" className={styles.toolButton} aria-label="Filter markets">
              <SlidersHorizontal size={18} />
            </button>
            <button type="button" className={styles.toolButton} aria-label="Saved markets">
              <Bookmark size={18} />
            </button>
          </div>
        </div>

        <div className={styles.marketChipRow}>
          {model.marketChips.map((chip) => (
            <button
              key={chip.slug}
              type="button"
              aria-pressed={chip.slug === activeChipSlug}
              onClick={() => setActiveChipSlug(chip.slug)}
              className={`${styles.marketChip} ${
                chip.slug === activeChipSlug ? styles.marketChipActive : ""
              }`.trim()}
            >
              {chip.label}
            </button>
          ))}
          <span className={styles.marketChipArrow}>
            <ChevronRight size={18} />
          </span>
        </div>

        <HomeMarketGrid
          key={activeChipSlug}
          events={filteredEvents}
          initialCount={16}
          incrementCount={8}
        />
      </section>
    </div>
  );
}
