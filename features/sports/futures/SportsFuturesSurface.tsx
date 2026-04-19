import { SportsModeSwitch } from "@/features/sports/live/SportsModeSwitch";
import { FuturesEventListCard } from "./FuturesEventListCard";
import { SportsFuturesFilterBar } from "./SportsFuturesFilterBar";
import { SportsFuturesLeagueRail } from "./SportsFuturesLeagueRail";
import type { SportsCardModel, SportsLeagueChip } from "./parse";
import styles from "./SportsFuturesSurface.module.css";

type SportsFuturesSurfaceProps = {
  title: string;
  description: string;
  leagueChips: ReadonlyArray<SportsLeagueChip>;
  cards: ReadonlyArray<SportsCardModel>;
  activeLeagueSlug?: string;
  emptyTitle: string;
  emptyCopy: string;
};

export function SportsFuturesSurface({
  title,
  description,
  leagueChips,
  cards,
  activeLeagueSlug,
  emptyTitle,
  emptyCopy,
}: SportsFuturesSurfaceProps) {
  return (
    <section className={styles.surface}>
      <SportsModeSwitch activeMode="futures" />

      <header className={styles.header}>
        <div className={styles.titleWrap}>
          <p className={styles.kicker}>Sports</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.description}>{description}</p>
        </div>
      </header>

      <SportsFuturesLeagueRail
        chips={leagueChips}
        allHref="/sports/futures"
        activeLeagueSlug={activeLeagueSlug}
      />

      <SportsFuturesFilterBar />

      {cards.length > 0 ? (
        <div className={styles.cards}>
          {cards.map((card) => (
            <FuturesEventListCard key={card.id} card={card} />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>{emptyTitle}</h2>
          <p className={styles.emptyCopy}>{emptyCopy}</p>
        </div>
      )}
    </section>
  );
}
