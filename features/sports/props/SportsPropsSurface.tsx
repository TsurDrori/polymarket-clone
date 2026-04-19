import { SportsModeSwitch } from "@/features/sports/live/SportsModeSwitch";
import type { SportsCardModel } from "@/features/sports/futures/parse";
import { SportsGamesPropsSwitch } from "./SportsGamesPropsSwitch";
import { SportsPropsCard } from "./SportsPropsCard";
import styles from "./SportsPropsSurface.module.css";

type SportsPropsSurfaceProps = {
  title: string;
  description: string;
  gamesHref: string;
  propsHref: string;
  cards: ReadonlyArray<SportsCardModel>;
};

export function SportsPropsSurface({
  title,
  description,
  gamesHref,
  propsHref,
  cards,
}: SportsPropsSurfaceProps) {
  return (
    <section className={styles.surface}>
      <SportsModeSwitch activeMode="futures" />

      <header className={styles.header}>
        <div className={styles.titleWrap}>
          <p className={styles.kicker}>Sports</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.description}>{description}</p>
        </div>

        <SportsGamesPropsSwitch
          gamesHref={gamesHref}
          propsHref={propsHref}
          activeRoute="props"
        />
      </header>

      {cards.length > 0 ? (
        <div className={styles.grid}>
          {cards.map((card) => (
            <SportsPropsCard key={card.id} card={card} />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>No props markets are available right now.</h2>
          <p className={styles.emptyCopy}>
            The public sports feed does not currently expose any non-game card markets
            for this league.
          </p>
        </div>
      )}
    </section>
  );
}
