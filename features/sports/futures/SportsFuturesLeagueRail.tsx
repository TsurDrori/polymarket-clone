import Link from "next/link";
import type { SportsLeagueChip } from "./parse";
import styles from "./SportsFuturesLeagueRail.module.css";

type SportsFuturesLeagueRailProps = {
  chips: ReadonlyArray<SportsLeagueChip>;
  allHref: string;
  activeLeagueSlug?: string;
};

export function SportsFuturesLeagueRail({
  chips,
  allHref,
  activeLeagueSlug,
}: SportsFuturesLeagueRailProps) {
  return (
    <nav className={styles.rail} aria-label="Sports leagues">
      <Link
        href={allHref}
        className={styles.chip}
        data-active={activeLeagueSlug === undefined}
      >
        <span>All Sports</span>
      </Link>

      {chips.map((chip) => (
        <Link
          key={chip.slug}
          href={chip.href}
          className={styles.chip}
          data-active={chip.active || chip.slug === activeLeagueSlug}
        >
          <span>{chip.label}</span>
          <span className={styles.count}>{chip.count}</span>
        </Link>
      ))}
    </nav>
  );
}
