import { Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import type {
  SportsLeagueChip,
  SportsbookSectionModel,
} from "@/features/sports/games/parse";
import { SportsbookSection } from "@/features/sports/games/SportsbookSection";
import { SportsLeagueRail } from "./SportsLeagueRail";
import { SportsModeSwitch } from "./SportsModeSwitch";
import { SportsRouteSwitch } from "./SportsRouteSwitch";
import { SportsTradePreview } from "./SportsTradePreview";
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
  const previewRow = sections[0]?.rows[0];
  const headerWeekLabel =
    leagueTabs && previewRow?.eventWeek ? `Week ${previewRow.eventWeek}` : null;

  return (
    <section className={styles.surface}>
      <div className={styles.layout}>
        <div className={styles.sidebar}>
          <SportsModeSwitch activeMode="live" className={styles.sidebarModeSwitch} />
          <SportsLeagueRail
            className={styles.sidebarRail}
            chips={leagueChips}
            activeLeagueSlug={activeLeagueSlug}
          />
        </div>

        <div className={styles.board}>
          <header className={styles.header}>
            <div className={styles.titleWrap}>
              <p className={styles.kicker}>Sports</p>
              <h1 className={styles.title}>{title}</h1>
              <p className={styles.description}>{description}</p>
            </div>

            <div className={styles.headerActions}>
              {leagueTabs ? (
                <SportsRouteSwitch
                  gamesHref={leagueTabs.gamesHref}
                  propsHref={leagueTabs.propsHref}
                />
              ) : null}

              <div className={styles.tools}>
                <button
                  type="button"
                  className={styles.toolButton}
                  aria-label="Search sports markets"
                >
                  <Search size={18} strokeWidth={2.2} />
                </button>

                {headerWeekLabel ? (
                  <button type="button" className={styles.weekPill}>
                    <span>{headerWeekLabel}</span>
                    <ChevronDown size={16} strokeWidth={2.2} />
                  </button>
                ) : null}

                <button type="button" className={styles.toolButton} aria-label="Filter sports markets">
                  <SlidersHorizontal size={18} strokeWidth={2.2} />
                </button>
              </div>
            </div>
          </header>

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
        </div>

        {previewRow ? <SportsTradePreview row={previewRow} /> : null}
      </div>
    </section>
  );
}
