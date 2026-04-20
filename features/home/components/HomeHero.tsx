"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HomeHeroModel } from "../selectors";
import { HeroFooterNav } from "./HeroFooterNav";
import { HeroRightRail } from "./HeroRightRail";
import { HeroSpotlightCard } from "./HeroSpotlightCard";
import styles from "./HomeHero.module.css";

type HomeHeroProps = {
  hero: HomeHeroModel;
};

const HERO_ROTATION_MS = 10_000;

export function HomeHero({ hero }: HomeHeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const scheduleNextRotationRef = useRef<(delayMs?: number) => void>(() => {});
  const remainingMsRef = useRef(HERO_ROTATION_MS);
  const startedAtRef = useRef<number | null>(null);
  const hasSpotlights = hero.spotlights.length > 0;
  const hasMultipleSpotlights = hero.spotlights.length > 1;
  const safeActiveIndex = hasSpotlights
    ? Math.min(activeIndex, hero.spotlights.length - 1)
    : 0;
  const activeSpotlight = hero.spotlights[safeActiveIndex] ?? hero.spotlight;

  const clearScheduledRotation = useCallback(() => {
    if (timeoutRef.current === null) return;

    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const prefersReducedMotion = useCallback(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }

    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const canAutoRotate = useCallback(() => {
    if (!hasMultipleSpotlights || isPaused || prefersReducedMotion()) {
      return false;
    }

    if (typeof document === "undefined") {
      return true;
    }

    return !document.hidden && document.hasFocus();
  }, [hasMultipleSpotlights, isPaused, prefersReducedMotion]);

  const scheduleNextRotation = useCallback((delayMs = remainingMsRef.current) => {
    clearScheduledRotation();
    if (!canAutoRotate()) {
      return;
    }

    startedAtRef.current = Date.now();
    timeoutRef.current = window.setTimeout(() => {
      startedAtRef.current = null;
      remainingMsRef.current = HERO_ROTATION_MS;
      setActiveIndex((currentIndex) => (currentIndex + 1) % hero.spotlights.length);
      scheduleNextRotationRef.current(HERO_ROTATION_MS);
    }, delayMs);
  }, [canAutoRotate, clearScheduledRotation, hero.spotlights.length]);

  useEffect(() => {
    scheduleNextRotationRef.current = scheduleNextRotation;
  }, [scheduleNextRotation]);

  const pauseRotation = useCallback(() => {
    if (startedAtRef.current !== null) {
      const elapsedMs = Date.now() - startedAtRef.current;
      remainingMsRef.current = Math.max(0, remainingMsRef.current - elapsedMs);
      startedAtRef.current = null;
    }

    clearScheduledRotation();
  }, [clearScheduledRotation]);

  const resumeRotation = useCallback(() => {
    if (!canAutoRotate()) {
      return;
    }

    if (remainingMsRef.current <= 0) {
      remainingMsRef.current = HERO_ROTATION_MS;
    }

    scheduleNextRotation(remainingMsRef.current);
  }, [canAutoRotate, scheduleNextRotation]);

  const resetRotation = useCallback(() => {
    remainingMsRef.current = HERO_ROTATION_MS;
    startedAtRef.current = null;

    if (canAutoRotate()) {
      scheduleNextRotation(HERO_ROTATION_MS);
      return;
    }

    clearScheduledRotation();
  }, [canAutoRotate, clearScheduledRotation, scheduleNextRotation]);

  const selectIndex = (index: number) => {
    if (!hasMultipleSpotlights) return;

    const total = hero.spotlights.length;
    setActiveIndex((index + total) % total);
    resetRotation();
  };

  useEffect(() => {
    if (!hasMultipleSpotlights) {
      clearScheduledRotation();
      remainingMsRef.current = HERO_ROTATION_MS;
      startedAtRef.current = null;
      return;
    }

    if (isPaused) {
      pauseRotation();
      return;
    }

    resumeRotation();
    return () => {
      pauseRotation();
    };
  }, [clearScheduledRotation, hasMultipleSpotlights, isPaused, pauseRotation, resumeRotation]);

  useEffect(() => {
    if (!hasMultipleSpotlights) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden || !document.hasFocus()) {
        pauseRotation();
        return;
      }

      if (!isPaused) {
        resumeRotation();
      }
    };

    const handleWindowBlur = () => {
      pauseRotation();
    };

    const handleWindowFocus = () => {
      if (!document.hidden && !isPaused) {
        resumeRotation();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [hasMultipleSpotlights, isPaused, pauseRotation, resumeRotation]);

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
