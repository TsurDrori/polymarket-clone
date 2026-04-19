"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { getEventImage } from "@/features/events/api/parse";
import { EventCard } from "@/features/events/components/EventCard";
import { EventGrid } from "@/features/events/components/EventGrid";
import { PriceCell } from "@/features/events/components/PriceCell";
import type { PolymarketEvent, PolymarketMarket } from "@/features/events/types";
import { formatEndDate, formatPct, formatVolume } from "@/shared/lib/format";
import { Chip } from "@/shared/ui/Chip";
import { getVisibleTags, hasTagSlug } from "@/shared/lib/tags";
import {
  collectTrendingTopics,
  getPrimaryMarket,
  selectBreakingItems,
  selectFeaturedEvents,
} from "./selectors";
import styles from "./HomePage.module.css";

type HomePageProps = {
  events: ReadonlyArray<PolymarketEvent>;
};

const BREAKING_LIMIT = 4;

const getHeroSummary = (event: PolymarketEvent): string => {
  if (event.description?.trim()) {
    return event.description.trim().slice(0, 180);
  }

  const primaryMarket = getPrimaryMarket(event);
  if (primaryMarket?.question.trim()) {
    return primaryMarket.question.trim();
  }

  const labels = getVisibleTags(event)
    .slice(0, 3)
    .map((tag) => tag.label);

  return labels.length > 0
    ? labels.join(" · ")
    : "Live market activity across the largest prediction surfaces on the page.";
};

const getDisplayPrice = (market?: PolymarketMarket): number =>
  market?.lastTradePrice || market?.outcomePrices[0] || market?.bestBid || 0;

const hasEarningsTag = (event: PolymarketEvent): boolean =>
  event.tags.some((tag) => /earn/i.test(tag.slug) || /earn/i.test(tag.label));

const getChangeLabel = (change: number): string => {
  const sign = change >= 0 ? "+" : "-";
  return `${sign}${Math.round(Math.abs(change) * 100)}%`;
};

const getEventMeta = (event: PolymarketEvent): string => {
  const tags = getVisibleTags(event)
    .slice(0, 2)
    .map((tag) => tag.label);

  if (event.endDate) {
    tags.push(`Ends ${formatEndDate(event.endDate)}`);
  }

  return tags.join(" · ");
};

function FeaturedHeroCard({ event }: { event: PolymarketEvent }) {
  const imageSrc = getEventImage(event) ?? "/placeholder.svg";
  const heroTags = getVisibleTags(event).slice(0, 3);
  const primaryMarket = getPrimaryMarket(event);
  const topMarkets = [...event.markets]
    .sort((left, right) => right.volumeNum - left.volumeNum)
    .slice(0, 3);
  const tokenId = primaryMarket?.clobTokenIds[0];

  return (
    <Link href={`/event/${event.slug}`} className={styles.heroCard}>
      <div className={styles.heroImageWrap}>
        <Image
          src={imageSrc}
          alt=""
          fill
          sizes="(max-width: 1023px) 100vw, 60vw"
          className={styles.heroImage}
        />
      </div>
      <div className={styles.heroScrim} />
      <div className={styles.heroContent}>
        <div className={styles.heroTagRow}>
          {heroTags.map((tag) => (
            <span key={tag.id} className={styles.heroTag}>
              {tag.label}
            </span>
          ))}
          <span className={styles.heroVolume}>{formatVolume(event.volume)} Vol.</span>
        </div>

        <div className={styles.heroBody}>
          <div className={styles.heroCopy}>
            <p className={styles.heroEyebrow}>Featured markets</p>
            <h2 className={styles.heroTitle}>{event.title}</h2>
            <p className={styles.heroSummary}>{getHeroSummary(event)}</p>
          </div>

          {event.showAllOutcomes && topMarkets.length > 1 ? (
            <div className={styles.heroOutcomeList}>
              {topMarkets.map((market) => {
                const priceTokenId = market.clobTokenIds[0];
                return (
                  <div key={market.id} className={styles.heroOutcomeRow}>
                    <span className={styles.heroOutcomeLabel}>
                      {market.groupItemTitle || market.question}
                    </span>
                    <span className={styles.heroOutcomePrice}>
                      {priceTokenId ? (
                        <PriceCell tokenId={priceTokenId} format={formatPct} />
                      ) : (
                        formatPct(getDisplayPrice(market))
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.heroActionBlock}>
              <div className={styles.heroLeadPrice}>
                {tokenId ? (
                  <PriceCell tokenId={tokenId} format={formatPct} />
                ) : (
                  formatPct(getDisplayPrice(primaryMarket))
                )}
              </div>
              <div className={styles.heroActionRow}>
                <span className={styles.heroActionYes}>Yes</span>
                <span className={styles.heroActionNo}>No</span>
              </div>
            </div>
          )}
        </div>

        <div className={styles.heroFooter}>
          <span>{getEventMeta(event)}</span>
          <span>Polymarket clone</span>
        </div>
      </div>
    </Link>
  );
}

export function HomePage({ events }: HomePageProps) {
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [hideSports, setHideSports] = useState(false);
  const [hideCrypto, setHideCrypto] = useState(false);
  const [hideEarnings, setHideEarnings] = useState(false);

  const featured = selectFeaturedEvents(events);
  const heroEvent = featured[0];
  const sideEvents = featured.slice(1, 5);
  const breaking = selectBreakingItems(events, BREAKING_LIMIT);
  const trendingTopics = collectTrendingTopics(events, 12);

  const filteredEvents = events.filter((event) => {
    if (selectedTopic !== "all" && !event.tags.some((tag) => tag.slug === selectedTopic)) {
      return false;
    }

    if (hideSports && hasTagSlug(event, "sports")) return false;
    if (hideCrypto && hasTagSlug(event, "crypto")) return false;
    if (hideEarnings && hasEarningsTag(event)) return false;

    return true;
  });

  return (
    <div className={styles.root}>
      <section className={styles.featuredSection} aria-labelledby="featured-markets">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.kicker}>Home surface</p>
            <h1 id="featured-markets" className={styles.heading}>
              Featured markets
            </h1>
          </div>
          <p className={styles.sectionCopy}>
            Live-priced hero markets, fast movers, and a fuller “explore all”
            grid that tracks closer to the current Polymarket homepage.
          </p>
        </div>

        <div className={styles.featuredLayout}>
          {heroEvent ? <FeaturedHeroCard event={heroEvent} /> : null}
          <div className={styles.featuredSideGrid}>
            {sideEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      </section>

      <section className={styles.breakingSection} aria-labelledby="breaking-news">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.kicker}>Fast movers</p>
            <h2 id="breaking-news" className={styles.subheading}>
              Breaking news
            </h2>
          </div>
          <p className={styles.sectionCopy}>
            The markets with the biggest one-day swings across the current
            homepage slice.
          </p>
        </div>

        <div className={styles.breakingGrid}>
          {breaking.map((item, index) => (
            <Link
              key={`${item.event.id}-${item.market.id}`}
              href={`/event/${item.event.slug}`}
              className={styles.breakingCard}
            >
              <span className={styles.breakingRank}>{index + 1}</span>
              <div className={styles.breakingBody}>
                <h3 className={styles.breakingTitle}>{item.event.title}</h3>
                <p className={styles.breakingMeta}>
                  {item.market.groupItemTitle || item.market.question}
                </p>
              </div>
              <div className={styles.breakingStats}>
                <span className={styles.breakingCurrent}>
                  {formatPct(item.currentPrice)}
                </span>
                <span
                  className={
                    item.change >= 0
                      ? styles.breakingChangeUp
                      : styles.breakingChangeDown
                  }
                >
                  {getChangeLabel(item.change)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.topicSection} aria-labelledby="hot-topics">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.kicker}>Discovery</p>
            <h2 id="hot-topics" className={styles.subheading}>
              Hot topics
            </h2>
          </div>
          <p className={styles.sectionCopy}>
            High-volume tags pulled from the same event slice powering the hero
            and market grid.
          </p>
        </div>

        <div className={styles.topicRail}>
          {trendingTopics.map((topic) => (
            <button
              key={topic.slug}
              type="button"
              className={styles.topicPill}
              onClick={() => setSelectedTopic(topic.slug)}
            >
              <span>{topic.label}</span>
              <span className={styles.topicPillMeta}>
                {formatVolume(topic.totalVolume)} today
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.marketSection} aria-labelledby="all-markets">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.kicker}>Explore</p>
            <h2 id="all-markets" className={styles.subheading}>
              Explore all
            </h2>
          </div>
          <p className={styles.sectionCopy}>
            Topic chips plus Polymarket-style hide toggles over the full event
            grid.
          </p>
        </div>

        <div className={styles.marketControls}>
          <div className={styles.marketControlRow}>
            <Chip
              active={selectedTopic === "all"}
              onClick={() => setSelectedTopic("all")}
            >
              All
            </Chip>
            {trendingTopics.map((topic) => (
              <Chip
                key={topic.slug}
                active={selectedTopic === topic.slug}
                onClick={() => setSelectedTopic(topic.slug)}
              >
                {topic.label}
              </Chip>
            ))}
          </div>

          <div className={styles.marketControlRow}>
            <span className={styles.staticChip}>24hr Volume</span>
            <span className={styles.staticChip}>All</span>
            <span className={styles.staticChip}>Active</span>
            <Chip active={hideSports} onClick={() => setHideSports((value) => !value)}>
              Hide sports
            </Chip>
            <Chip active={hideCrypto} onClick={() => setHideCrypto((value) => !value)}>
              Hide crypto
            </Chip>
            <Chip
              active={hideEarnings}
              onClick={() => setHideEarnings((value) => !value)}
            >
              Hide earnings
            </Chip>
          </div>
        </div>

        {filteredEvents.length > 0 ? (
          <EventGrid events={filteredEvents} />
        ) : (
          <div className={styles.emptyState}>
            No markets match the current combination of topic and hide filters.
          </div>
        )}
      </section>
    </div>
  );
}
