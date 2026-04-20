"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import type { HomePageModel } from "./selectors";
import { fetchHomeChipFeed } from "./api";
import { CompactHeroDiscovery } from "./components/CompactHeroDiscovery";
import { HomeHero } from "./components/HomeHero";
import { HomeMarketGrid } from "./components/HomeMarketGrid";
import styles from "./HomePage.module.css";

type HomePageProps = {
  model: HomePageModel;
};

export function HomePage({ model }: HomePageProps) {
  const chipRailRef = useRef<HTMLDivElement | null>(null);
  const [activeChipSlug, setActiveChipSlug] = useState(
    model.marketChips[0]?.slug ?? "all",
  );
  const [eventsByChip, setEventsByChip] = useState(() => ({
    all: model.exploreEvents,
  }));
  const [loadingChipSlug, setLoadingChipSlug] = useState<string | null>(null);
  const [feedError, setFeedError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const activeEvents = useMemo(
    () => eventsByChip[activeChipSlug] ?? [],
    [activeChipSlug, eventsByChip],
  );

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  const scrollChipRailForward = () => {
    const rail = chipRailRef.current;
    if (!rail) return;

    rail.scrollBy({
      left: Math.max(rail.clientWidth * 0.75, 240),
      behavior: "smooth",
    });
  };

  const selectChip = (chipSlug: string) => {
    startTransition(() => {
      setActiveChipSlug(chipSlug);
    });

    setFeedError(null);

    if (chipSlug === "all" || eventsByChip[chipSlug]) {
      setLoadingChipSlug(null);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoadingChipSlug(chipSlug);

    void fetchHomeChipFeed(chipSlug, controller.signal)
      .then((events) => {
        if (controller.signal.aborted) return;

        startTransition(() => {
          setEventsByChip((current) => ({
            ...current,
            [chipSlug]: events,
          }));
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        setFeedError(
          error instanceof Error ? error.message : "Unable to load this market feed.",
        );
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setLoadingChipSlug((current) => (current === chipSlug ? null : current));
      });
  };

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

        <div ref={chipRailRef} className={styles.marketChipRow}>
          {model.marketChips.map((chip) => (
            <button
              key={chip.slug}
              type="button"
              aria-pressed={chip.slug === activeChipSlug}
              onClick={() => selectChip(chip.slug)}
              className={`${styles.marketChip} ${
                chip.slug === activeChipSlug ? styles.marketChipActive : ""
              }`.trim()}
            >
              {chip.label}
            </button>
          ))}
          <button
            type="button"
            aria-label="Scroll market topics"
            className={styles.marketChipArrow}
            onClick={scrollChipRailForward}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {feedError ? (
          <p className={styles.marketFeedStatus} role="status">
            {feedError}
          </p>
        ) : null}

        {loadingChipSlug === activeChipSlug && activeEvents.length === 0 ? (
          <p className={styles.marketFeedStatus} role="status">
            Loading markets…
          </p>
        ) : null}

        <HomeMarketGrid
          key={activeChipSlug}
          events={activeEvents}
          initialCount={16}
          incrementCount={8}
        />
      </section>
    </div>
  );
}
