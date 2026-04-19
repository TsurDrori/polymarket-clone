import Link from "next/link";
import type { SportsLeagueChip } from "@/features/sports/games/parse";
import styles from "./SportsLeagueRail.module.css";

type SportsLeagueRailProps = {
  chips: ReadonlyArray<SportsLeagueChip>;
  activeLeagueSlug?: string;
};

export function SportsLeagueRail({
  chips,
  activeLeagueSlug,
}: SportsLeagueRailProps) {
  return (
    <nav className={styles.rail} aria-label="Sports leagues">
      <Link
        href="/sports/live"
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
