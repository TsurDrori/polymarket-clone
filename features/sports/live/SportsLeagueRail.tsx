import clsx from "clsx";
import Link from "next/link";
import type { SportsLeagueChip } from "@/features/sports/games/parse";
import styles from "./SportsLeagueRail.module.css";

type SportsLeagueRailProps = {
  chips: ReadonlyArray<SportsLeagueChip>;
  activeLeagueSlug?: string;
  className?: string;
};

const LEAGUE_MARKS: Record<string, string> = {
  nba: "NB",
  ucl: "UC",
  nhl: "NH",
  ufc: "UF",
  nfl: "NF",
  mlb: "ML",
  epl: "EP",
  atp: "AT",
  wta: "WT",
  tennis: "TN",
  cricket: "CR",
  rugby: "RG",
  golf: "GF",
  formula1: "F1",
  football: "FB",
  soccer: "SC",
  baseball: "BS",
  hockey: "HK",
  basketball: "BK",
  valorant: "VL",
  "counter-strike-2": "CS",
  "league-of-legends": "LG",
  "dota-2": "D2",
};

const getLeagueMark = (slug: string, label: string): string =>
  LEAGUE_MARKS[slug] ??
  (label.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase() || "SP");

export function SportsLeagueRail({
  chips,
  activeLeagueSlug,
  className,
}: SportsLeagueRailProps) {
  return (
    <nav className={clsx(styles.rail, className)} aria-label="Sports leagues">
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
          <span className={styles.labelWrap}>
            <span className={styles.mark} aria-hidden="true">
              {getLeagueMark(chip.slug, chip.label)}
            </span>
            <span>{chip.label}</span>
          </span>
          <span className={styles.count}>{chip.count}</span>
        </Link>
      ))}
    </nav>
  );
}
