import Image from "next/image";
import Link from "next/link";
import { getEventImage } from "@/features/events/api/parse";
import { EventGrid } from "@/features/events/components/EventGrid";
import { EventCard } from "@/features/events/components/EventCard";
import { PriceCell } from "@/features/events/components/PriceCell";
import type { PolymarketEvent, PolymarketMarket } from "@/features/events/types";
import { formatEndDate, formatPct, formatVolume } from "@/shared/lib/format";
import { getVisibleTags } from "@/shared/lib/tags";
import {
  getPrimaryMarket,
  type HomePageModel,
  type TopicSummary,
} from "./selectors";
import styles from "./HomePage.module.css";

type HomePageProps = {
  model: HomePageModel;
};

const CATEGORY_ROUTES = new Map<string, string>([
  ["politics", "/politics"],
  ["sports", "/sports"],
  ["crypto", "/crypto"],
]);

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

const getEventMeta = (event: PolymarketEvent): string => {
  const tags = getVisibleTags(event)
    .slice(0, 2)
    .map((tag) => tag.label);

  if (event.endDate) {
    tags.push(`Ends ${formatEndDate(event.endDate)}`);
  }

  return tags.join(" · ");
};

const getTopicMeta = (topic: TopicSummary): string =>
  `${topic.eventCount} markets · ${formatVolume(topic.totalVolume)} today`;

function TopicItem({ topic, rank }: { topic: TopicSummary; rank: number }) {
  const href = CATEGORY_ROUTES.get(topic.slug);

  return (
    <li className={styles.topicItem}>
      <span className={styles.topicRank}>{String(rank).padStart(2, "0")}</span>
      <div className={styles.topicBody}>
        {href ? (
          <Link href={href} className={styles.topicLink}>
            {topic.label}
          </Link>
        ) : (
          <span className={styles.topicLabel}>{topic.label}</span>
        )}
        <span className={styles.topicMeta}>{getTopicMeta(topic)}</span>
      </div>
    </li>
  );
}

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
      <div className={styles.heroMedia}>
        <Image
          src={imageSrc}
          alt=""
          fill
          priority
          sizes="(max-width: 1023px) 100vw, 42rem"
          className={styles.heroImage}
        />
      </div>

      <div className={styles.heroContent}>
        <div className={styles.heroTopRow}>
          <div className={styles.heroTagRow}>
            {heroTags.map((tag) => (
              <span key={tag.id} className={styles.heroTag}>
                {tag.label}
              </span>
            ))}
          </div>
          <span className={styles.heroVolume}>{formatVolume(event.volume)} Vol.</span>
        </div>

        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Top market</p>
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
                      <PriceCell tokenId={priceTokenId} formatKind="pct" />
                    ) : (
                      formatPct(getDisplayPrice(market))
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.heroPriceRow}>
            <div className={styles.heroLeadPrice}>
              {tokenId ? (
                <PriceCell tokenId={tokenId} formatKind="pct" />
              ) : (
                formatPct(getDisplayPrice(primaryMarket))
              )}
            </div>
            <div className={styles.heroOutcomePills}>
              <span className={styles.heroOutcomeYes}>Yes</span>
              <span className={styles.heroOutcomeNo}>No</span>
            </div>
          </div>
        )}

        <div className={styles.heroFooter}>
          <span>{getEventMeta(event)}</span>
          <span>Sorted by 24hr volume</span>
        </div>
      </div>
    </Link>
  );
}

export function HomePage({ model }: HomePageProps) {
  const { heroEvent, featuredEvents, breakingItems, topicSummaries, exploreEvents } = model;

  return (
    <div className={styles.root}>
      <section className={styles.featuredSection} aria-labelledby="featured-markets">
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Trending</p>
            <h1 id="featured-markets" className={styles.heading}>
              Featured markets
            </h1>
          </div>
          <p className={styles.sectionCopy}>
            A lighter home surface with one lead market, fast movers, and the
            highest-volume cards that are safest to wire into realtime next.
          </p>
        </div>

        <div className={styles.featuredLayout}>
          {heroEvent ? <FeaturedHeroCard event={heroEvent} /> : null}
          <div className={styles.featuredSideGrid}>
            {featuredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      </section>

      <div className={styles.secondaryLayout}>
        <section className={styles.panel} aria-labelledby="breaking-news">
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.eyebrow}>Breaking</p>
              <h2 id="breaking-news" className={styles.subheading}>
                Fast movers
              </h2>
            </div>
            <span className={styles.panelMeta}>Largest 1d change</span>
          </div>

          <div className={styles.breakingList}>
            {breakingItems.map((item) => (
              <Link
                key={`${item.event.id}-${item.market.id}`}
                href={`/event/${item.event.slug}`}
                className={styles.breakingItem}
              >
                <div className={styles.breakingCopy}>
                  <span className={styles.breakingLabel}>
                    {item.market.groupItemTitle || item.market.question}
                  </span>
                  <strong className={styles.breakingTitle}>{item.event.title}</strong>
                </div>
                <div className={styles.breakingStats}>
                  <span>{formatPct(item.currentPrice)}</span>
                  <span
                    className={
                      item.change >= 0 ? styles.breakingChangeUp : styles.breakingChangeDown
                    }
                  >
                    {item.change >= 0 ? "+" : "-"}
                    {Math.round(Math.abs(item.change) * 100)}%
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.panel} aria-labelledby="hot-topics">
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.eyebrow}>Hot topics</p>
              <h2 id="hot-topics" className={styles.subheading}>
                Ranked now
              </h2>
            </div>
            <span className={styles.panelMeta}>By 24hr volume</span>
          </div>

          <ol className={styles.topicList}>
            {topicSummaries.map((topic, index) => (
              <TopicItem key={topic.slug} topic={topic} rank={index + 1} />
            ))}
          </ol>
        </section>
      </div>

      <section className={styles.marketSection} aria-labelledby="all-markets">
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Explore</p>
            <h2 id="all-markets" className={styles.subheading}>
              All markets
            </h2>
          </div>
          <p className={styles.sectionCopy}>
            Active markets sorted by 24-hour volume. The baseline stays
            server-rendered, with the card itself remaining the client island.
          </p>
        </div>

        <EventGrid events={exploreEvents} />
      </section>
    </div>
  );
}
