import Link from "next/link";
import type { HeroChip } from "../selectors";
import styles from "./HomeHero.module.css";

type HeroFooterNavProps = {
  chips: ReadonlyArray<HeroChip>;
};

const FOOTER_DOTS = 5;

export function HeroFooterNav({ chips }: HeroFooterNavProps) {
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

      <div className={styles.footerChipGroup} aria-label="Spotlight context chips">
        {chips.slice(0, 2).map((chip) =>
          chip.href ? (
            <Link key={chip.slug} href={chip.href} className={styles.footerChip}>
              {chip.label}
            </Link>
          ) : (
            <span key={chip.slug} className={styles.footerChip}>
              {chip.label}
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
