"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import type { HomePageModel } from "./selectors";
import { fetchHomeChipFeed } from "./api";
import { CompactHeroDiscovery } from "./components/CompactHeroDiscovery";
import { HomeHero } from "./components/HomeHero";
import { HomeMarketGrid } from "./components/HomeMarketGrid";
import {
  buildHomeEventCardEntries,
  type HomeCardEntry,
} from "./components/homeCardModel";
import styles from "./HomePage.module.css";

type HomePageProps = {
  model: HomePageModel;
  initialExploreCards: ReadonlyArray<HomeCardEntry>;
};

type CardsByChip = Record<string, HomeCardEntry[]>;
const CHIP_RAIL_SCROLL_STEP = 240;

export function HomePage({ model, initialExploreCards }: HomePageProps) {
  const chipRailRef = useRef<HTMLDivElement | null>(null);
  const [activeChipSlug, setActiveChipSlug] = useState(
    model.marketChips[0]?.slug ?? "all",
  );
  const [cardsByChip, setCardsByChip] = useState<CardsByChip>(() => ({
    all: [...initialExploreCards],
  }));
  const [loadingChipSlug, setLoadingChipSlug] = useState<string | null>(null);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [canScrollChipRailBackward, setCanScrollChipRailBackward] = useState(false);
  const [canScrollChipRailForward, setCanScrollChipRailForward] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const activeCards = useMemo(
    () => cardsByChip[activeChipSlug] ?? [],
    [activeChipSlug, cardsByChip],
  );

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  useEffect(() => {
    const rail = chipRailRef.current;
    if (!rail) return;

    const syncChipRailState = () => {
      const maxScrollLeft = Math.max(rail.scrollWidth - rail.clientWidth, 0);
      setCanScrollChipRailBackward(rail.scrollLeft > 4);
      setCanScrollChipRailForward(maxScrollLeft - rail.scrollLeft > 4);
    };

    syncChipRailState();

    rail.addEventListener("scroll", syncChipRailState, { passive: true });
    window.addEventListener("resize", syncChipRailState);

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            syncChipRailState();
          });

    resizeObserver?.observe(rail);

    return () => {
      rail.removeEventListener("scroll", syncChipRailState);
      window.removeEventListener("resize", syncChipRailState);
      resizeObserver?.disconnect();
    };
  }, [model.marketChips]);

  const scrollChipRail = (direction: "backward" | "forward") => {
    const rail = chipRailRef.current;
    if (!rail) return;

    rail.scrollBy({
      left:
        Math.max(rail.clientWidth * 0.75, CHIP_RAIL_SCROLL_STEP) *
        (direction === "forward" ? 1 : -1),
      behavior: "smooth",
    });
  };

  const selectChip = (chipSlug: string) => {
    startTransition(() => {
      setActiveChipSlug(chipSlug);
    });

    setFeedError(null);

    if (chipSlug === "all" || cardsByChip[chipSlug]) {
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
          setCardsByChip((current) => ({
            ...current,
            [chipSlug]: buildHomeEventCardEntries(events),
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

        <div
          className={`${styles.marketChipRail} ${
            canScrollChipRailBackward ? styles.marketChipRailLeftVisible : ""
          } ${canScrollChipRailForward ? styles.marketChipRailRightVisible : ""}`.trim()}
        >
          {canScrollChipRailBackward ? (
            <button
              type="button"
              aria-label="Scroll market topics backward"
              className={`${styles.marketChipArrow} ${styles.marketChipArrowLeft}`}
              onClick={() => scrollChipRail("backward")}
            >
              <ChevronLeft size={18} />
            </button>
          ) : null}
          <div
            ref={chipRailRef}
            className={styles.marketChipRow}
            data-testid="market-chip-row"
          >
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
          </div>
          {canScrollChipRailForward ? (
            <button
              type="button"
              aria-label="Scroll market topics forward"
              className={`${styles.marketChipArrow} ${styles.marketChipArrowRight}`}
              onClick={() => scrollChipRail("forward")}
            >
              <ChevronRight size={18} />
            </button>
          ) : null}
        </div>

        {feedError ? (
          <p className={styles.marketFeedStatus} role="status">
            {feedError}
          </p>
        ) : null}

        {loadingChipSlug === activeChipSlug && activeCards.length === 0 ? (
          <p className={styles.marketFeedStatus} role="status">
            Loading markets…
          </p>
        ) : null}

        <HomeMarketGrid
          key={activeChipSlug}
          items={activeCards}
          initialCount={16}
          incrementCount={8}
        />
      </section>
    </div>
  );
}
