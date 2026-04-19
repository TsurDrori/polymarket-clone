"use client";

import { useState } from "react";
import { EventGrid } from "@/features/events/components/EventGrid";
import type { PolymarketEvent, PolymarketMarket } from "@/features/events/types";
import { formatCents, formatEndDate, formatVolume } from "@/shared/lib/format";
import { Chip } from "@/shared/ui/Chip";
import {
  getSportsLeague,
  getSpreadOutcomeLabel,
  getTotalOutcomeLabel,
  isSportsFutureEvent,
  isSportsGameEvent,
  pickMoneylineMarket,
  pickSpreadMarket,
  pickTotalMarket,
} from "../parse";
import styles from "./SportsHub.module.css";

type SportsHubProps = {
  events: ReadonlyArray<PolymarketEvent>;
};

type SportsView = "live" | "futures";

const getMarketLabel = (
  market: PolymarketMarket,
  index: number,
  kind: "moneyline" | "spread" | "total",
): string => {
  if (kind === "spread") return getSpreadOutcomeLabel(market, index);
  if (kind === "total") return getTotalOutcomeLabel(market, index);
  return market.outcomes[index] ?? `Outcome ${index + 1}`;
};

export function SportsHub({ events }: SportsHubProps) {
  const [view, setView] = useState<SportsView>("live");
  const [leagueFilter, setLeagueFilter] = useState<string>("all");

  const gameEvents = events.filter(isSportsGameEvent);
  const futureEvents = events.filter(isSportsFutureEvent);
  const leagueCounts = new Map<string, { label: string; count: number }>();

  for (const event of gameEvents) {
    const league = getSportsLeague(event);
    const existing = leagueCounts.get(league.slug);
    if (existing) {
      existing.count += 1;
    } else {
      leagueCounts.set(league.slug, { label: league.label, count: 1 });
    }
  }

  const leagueOptions = [...leagueCounts.entries()]
    .sort((left, right) => right[1].count - left[1].count)
    .slice(0, 5);

  const visibleGames = gameEvents.filter((event) => {
    if (leagueFilter === "all") return true;
    return getSportsLeague(event).slug === leagueFilter;
  });

  const visibleFutures = futureEvents.filter((event) => {
    if (leagueFilter === "all") return true;
    return getSportsLeague(event).slug === leagueFilter;
  });

  const groupedGames = new Map<string, { label: string; events: PolymarketEvent[] }>();
  for (const event of visibleGames) {
    const league = getSportsLeague(event);
    const group = groupedGames.get(league.slug);
    if (group) {
      group.events.push(event);
    } else {
      groupedGames.set(league.slug, { label: league.label, events: [event] });
    }
  }

  return (
    <section className={styles.root}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Category surface</p>
          <h1 className={styles.title}>Sports</h1>
        </div>
        <p className={styles.copy}>
          A sportsbook-style live view for game markets, with a futures tab that
          falls back to the existing Polymarket-style card grid.
        </p>
      </header>

      <div className={styles.controls}>
        <div className={styles.controlRow}>
          <Chip active={view === "live"} onClick={() => setView("live")}>
            Live {gameEvents.length}
          </Chip>
          <Chip active={view === "futures"} onClick={() => setView("futures")}>
            Futures {futureEvents.length}
          </Chip>
        </div>

        <div className={styles.controlRow}>
          <Chip
            active={leagueFilter === "all"}
            onClick={() => setLeagueFilter("all")}
          >
            All leagues
          </Chip>
          {leagueOptions.map(([slug, league]) => (
            <Chip
              key={slug}
              active={leagueFilter === slug}
              onClick={() => setLeagueFilter(slug)}
            >
              {league.label} {league.count}
            </Chip>
          ))}
        </div>
      </div>

      {view === "live" ? (
        <div className={styles.liveSections}>
          {[...groupedGames.entries()].map(([slug, group]) => (
            <section key={slug} className={styles.leagueSection}>
              <div className={styles.leagueHeader}>
                <h2 className={styles.leagueTitle}>{group.label}</h2>
                <span className={styles.leagueMeta}>{group.events.length} games</span>
              </div>

              <div className={styles.gameList}>
                {group.events.map((event) => {
                  const moneyline = pickMoneylineMarket(event);
                  const spread = pickSpreadMarket(event);
                  const total = pickTotalMarket(event);

                  return (
                    <article key={event.id} className={styles.gameCard}>
                      <div className={styles.gameHeader}>
                        <div>
                          <h3 className={styles.gameTitle}>{event.title}</h3>
                          <p className={styles.gameMeta}>
                            {formatVolume(event.volume)} Vol.
                            {event.endDate ? ` · Ends ${formatEndDate(event.endDate)}` : ""}
                          </p>
                        </div>
                        <span className={styles.gameBadge}>
                          {getSportsLeague(event).label}
                        </span>
                      </div>

                      {moneyline ? (
                        <div className={styles.marketBlock}>
                          <span className={styles.marketLabel}>Moneyline</span>
                          <div className={styles.marketButtonRow}>
                            {moneyline.outcomes.map((outcome, index) => (
                              <span key={`${moneyline.id}-${outcome}`} className={styles.marketButton}>
                                {getMarketLabel(moneyline, index, "moneyline")}
                                <strong>
                                  {formatCents(moneyline.outcomePrices[index] ?? 0)}
                                </strong>
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {spread ? (
                        <div className={styles.marketBlock}>
                          <span className={styles.marketLabel}>Spread</span>
                          <div className={styles.marketButtonRow}>
                            {spread.outcomes.map((outcome, index) => (
                              <span key={`${spread.id}-${outcome}`} className={styles.marketButton}>
                                {getMarketLabel(spread, index, "spread")}
                                <strong>
                                  {formatCents(spread.outcomePrices[index] ?? 0)}
                                </strong>
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {total ? (
                        <div className={styles.marketBlock}>
                          <span className={styles.marketLabel}>Total</span>
                          <div className={styles.marketButtonRow}>
                            {total.outcomes.map((outcome, index) => (
                              <span key={`${total.id}-${outcome}`} className={styles.marketButton}>
                                {getMarketLabel(total, index, "total")}
                                <strong>
                                  {formatCents(total.outcomePrices[index] ?? 0)}
                                </strong>
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}

          {visibleGames.length === 0 ? (
            <div className={styles.emptyState}>
              No live-style game markets match the current league filter.
            </div>
          ) : null}
        </div>
      ) : visibleFutures.length > 0 ? (
        <EventGrid events={visibleFutures} />
      ) : (
        <div className={styles.emptyState}>
          No sports futures match the current league filter.
        </div>
      )}
    </section>
  );
}
