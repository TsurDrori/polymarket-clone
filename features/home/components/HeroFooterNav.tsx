import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HeroSpotlightModel } from "../selectors";
import styles from "./HomeHero.module.css";

type HeroFooterNavProps = {
  spotlights: ReadonlyArray<HeroSpotlightModel>;
  activeIndex: number;
  onSelect: (index: number) => void;
};

export function HeroFooterNav({
  spotlights,
  activeIndex,
  onSelect,
}: HeroFooterNavProps) {
  if (spotlights.length === 0) {
    return null;
  }

  const previousIndex =
    (activeIndex - 1 + spotlights.length) % spotlights.length;
  const nextIndex = (activeIndex + 1) % spotlights.length;
  const previousSpotlight = spotlights[previousIndex];
  const nextSpotlight = spotlights[nextIndex];

  return (
    <div className={styles.footerNav} data-footer-nav>
      <div className={styles.dotGroup} aria-label="Spotlight pages">
        {spotlights.map((spotlight, index) => (
          <button
            key={spotlight.market.id}
            type="button"
            className={`${styles.dotButton} ${
              index === activeIndex ? styles.dotActive : ""
            }`.trim()}
            aria-label={`Show ${spotlight.navigationLabel}`}
            aria-pressed={index === activeIndex}
            onClick={() => onSelect(index)}
          />
        ))}
      </div>

      <div className={styles.footerChipGroup} aria-label="Spotlight topic navigation">
        <button
          type="button"
          className={`${styles.footerChipButton} ${styles.footerChipPrev}`.trim()}
          onClick={() => onSelect(previousIndex)}
          aria-label={`Show previous spotlight: ${previousSpotlight.navigationLabel}`}
          data-footer-prev
        >
          <ChevronLeft size={16} />
          <span>{previousSpotlight.navigationLabel}</span>
        </button>

        <button
          type="button"
          className={`${styles.footerChipButton} ${styles.footerChipNext}`.trim()}
          onClick={() => onSelect(nextIndex)}
          aria-label={`Show next spotlight: ${nextSpotlight.navigationLabel}`}
          data-footer-next
        >
          <span>{nextSpotlight.navigationLabel}</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
