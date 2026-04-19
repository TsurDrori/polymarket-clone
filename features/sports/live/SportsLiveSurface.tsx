import type {
  SportsLeagueChip,
  SportsbookSectionModel,
} from "@/features/sports/games/parse";
import { SportsbookSection } from "@/features/sports/games/SportsbookSection";
import { SportsLeagueRail } from "./SportsLeagueRail";
import { SportsModeSwitch } from "./SportsModeSwitch";
import { SportsRouteSwitch } from "./SportsRouteSwitch";
import styles from "./SportsLiveSurface.module.css";

type SportsLiveSurfaceProps = {
  title: string;
  description: string;
  leagueChips: ReadonlyArray<SportsLeagueChip>;
  sections: ReadonlyArray<SportsbookSectionModel>;
  activeLeagueSlug?: string;
  leagueTabs?: {
    gamesHref: string;
    propsHref: string;
  };
};

export function SportsLiveSurface({
  title,
  description,
  leagueChips,
  sections,
  activeLeagueSlug,
  leagueTabs,
}: SportsLiveSurfaceProps) {
  const hasContent = sections.length > 0;

  return (
    <section className={styles.surface}>
      <SportsModeSwitch activeMode="live" />

      <header className={styles.header}>
        <div className={styles.titleWrap}>
          <p className={styles.kicker}>Sports</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.description}>{description}</p>
        </div>

        {leagueTabs ? (
          <SportsRouteSwitch
            gamesHref={leagueTabs.gamesHref}
            propsHref={leagueTabs.propsHref}
          />
        ) : null}
      </header>

      <SportsLeagueRail chips={leagueChips} activeLeagueSlug={activeLeagueSlug} />

      {hasContent ? (
        <div className={styles.sections}>
          {sections.map((section) => (
            <SportsbookSection key={section.id} section={section} />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>No games are live right now.</h2>
          <p className={styles.emptyCopy}>
            The public games feed is empty for this slice at the moment. Check back soon.
          </p>
        </div>
      )}
    </section>
  );
}
