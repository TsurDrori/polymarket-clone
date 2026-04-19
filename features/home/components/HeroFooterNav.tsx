import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HeroChip } from "../selectors";
import styles from "./HomeHero.module.css";

type HeroFooterNavProps = {
  chips: ReadonlyArray<HeroChip>;
};

const FOOTER_DOTS = 5;

export function HeroFooterNav({ chips }: HeroFooterNavProps) {
  const subjectChips = chips.filter((chip) => chip.slug !== "all").slice(0, 2);

  return (
    <div className={styles.footerNav}>
      <div className={styles.dotGroup} aria-label="Spotlight pages">
        {Array.from({ length: FOOTER_DOTS }, (_, index) => (
          <span
            key={index}
            className={`${styles.dot} ${index === 0 ? styles.dotActive : ""}`.trim()}
            aria-hidden="true"
          />
        ))}
      </div>

      <div className={styles.footerChipGroup} aria-label="Spotlight topic navigation">
        {subjectChips.map((chip, index) =>
          chip.href ? (
            <Link key={chip.slug} href={chip.href} className={styles.footerChip}>
              {index === 0 ? <ChevronLeft size={16} /> : null}
              <span>{chip.label}</span>
              {index === subjectChips.length - 1 ? <ChevronRight size={16} /> : null}
            </Link>
          ) : (
            <span key={chip.slug} className={styles.footerChip}>
              {index === 0 ? <ChevronLeft size={16} /> : null}
              <span>{chip.label}</span>
              {index === subjectChips.length - 1 ? <ChevronRight size={16} /> : null}
            </span>
          ),
        )}
      </div>

      <Link href="#all-markets" className={styles.exploreLink}>
        Explore all
      </Link>
    </div>
  );
}
