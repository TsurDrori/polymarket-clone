import Link from "next/link";
import type { HeroChip } from "../selectors";
import styles from "./HomeHero.module.css";

type CompactHeroDiscoveryProps = {
  chips: ReadonlyArray<HeroChip>;
};

export function CompactHeroDiscovery({
  chips,
}: CompactHeroDiscoveryProps) {
  return (
    <section className={styles.compactDiscovery} aria-label="Homepage discovery">
      <div className={styles.compactChipGroup}>
        {chips.map((chip, index) =>
          chip.href ? (
            <Link
              key={chip.slug}
              href={chip.href}
              className={`${styles.compactChip} ${
                index === 0 ? styles.compactChipActive : ""
              }`.trim()}
            >
              {chip.label}
            </Link>
          ) : (
            <span
              key={chip.slug}
              className={`${styles.compactChip} ${
                index === 0 ? styles.compactChipActive : ""
              }`.trim()}
            >
              {chip.label}
            </span>
          ),
        )}
      </div>
    </section>
  );
}
