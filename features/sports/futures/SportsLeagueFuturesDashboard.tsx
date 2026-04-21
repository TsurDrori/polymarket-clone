import type { CSSProperties } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { PriceCell } from "@/features/events/components/PriceCell";
import { SportsModeSwitch } from "@/features/sports/live/SportsModeSwitch";
import type {
  SportsFuturesDashboardCard,
  SportsFuturesDashboardOutcome,
  SportsFuturesLeagueDashboardPayload,
  SportsFuturesLeagueSidebarItem,
  SportsFuturesLeagueSidebarSection,
} from "./dashboardModels";
import styles from "./SportsLeagueFuturesDashboard.module.css";

type SportsLeagueFuturesDashboardProps = {
  payload: SportsFuturesLeagueDashboardPayload;
  rootHref?: string;
};

type OutcomePriceProps = {
  outcome: SportsFuturesDashboardOutcome;
};

type BarCardProps = {
  card: SportsFuturesDashboardCard;
  compact?: boolean;
};

function OutcomePrice({ outcome }: OutcomePriceProps) {
  return outcome.tokenId ? (
    <PriceCell
      tokenId={outcome.tokenId}
      formatKind="sportsPct"
      fallbackValue={outcome.probability}
    />
  ) : (
    outcome.probabilityLabel
  );
}

function SidebarItem({ item }: { item: SportsFuturesLeagueSidebarItem }) {
  return (
    <Link href={item.href} className={styles.sidebarItem} data-active={item.active || undefined}>
      <span>{item.label}</span>
      <span className={styles.sidebarCount}>{item.countLabel}</span>
    </Link>
  );
}

function SidebarSection({ section }: { section: SportsFuturesLeagueSidebarSection }) {
  return (
    <section className={styles.sidebarSection} aria-labelledby={`futures-group-${section.title}`}>
      <div className={styles.sidebarSectionHeader}>
        <h3 className={styles.sidebarSectionTitle} id={`futures-group-${section.title}`}>
          {section.title}
        </h3>
        <ChevronDown size={12} strokeWidth={2.2} />
      </div>

      {section.items.length > 0 ? (
        <div className={styles.sidebarSectionItems}>
          {section.items.map((item) => (
            <SidebarItem key={item.slug} item={item} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function BarOutcomeRow({
  outcome,
  compact,
}: {
  outcome: SportsFuturesDashboardOutcome;
  compact?: boolean;
}) {
  const style = {
    "--bar-accent": outcome.accentColor,
    "--bar-width": `${Math.max(outcome.probability * 100, 1)}%`,
  } as CSSProperties;

  return (
    <li className={styles.barOutcome}>
      <div className={styles.outcomeMeta}>
        <span className={styles.outcomeBadge} style={{ backgroundColor: outcome.accentColor }}>
          {outcome.shortLabel}
        </span>
        <span className={styles.outcomeLabel} title={outcome.label}>
          {outcome.label}
        </span>
      </div>

      <div className={styles.outcomeValueWrap}>
        <strong className={styles.outcomeValue}>
          <OutcomePrice outcome={outcome} />
        </strong>
        <span
          className={compact ? styles.outcomeBarCompact : styles.outcomeBar}
          style={style}
          aria-hidden="true"
        />
      </div>
    </li>
  );
}

function BarCard({ card, compact }: BarCardProps) {
  return (
    <article className={compact ? styles.cardCompactBar : styles.cardHero}>
      <h2 className={styles.cardTitle}>{card.title}</h2>

      <ul className={styles.barOutcomeList}>
        {card.outcomes.map((outcome) => (
          <BarOutcomeRow key={outcome.id} outcome={outcome} compact={compact} />
        ))}
      </ul>

      {card.hiddenOutcomeCount > 0 ? (
        <Link href={card.href} className={styles.showMore}>
          <span>Show More</span>
          <ChevronDown size={12} strokeWidth={2.1} />
        </Link>
      ) : null}
    </article>
  );
}

function CompactListCard({ card }: { card: SportsFuturesDashboardCard }) {
  return (
    <article className={styles.cardList}>
      <h2 className={styles.cardTitle}>{card.title}</h2>

      <ul className={styles.listOutcomeList}>
        {card.outcomes.map((outcome) => (
          <li key={outcome.id} className={styles.listOutcomeRow}>
            <span className={styles.listOutcomeLabel} title={outcome.label}>
              {outcome.label}
            </span>
            <strong className={styles.listOutcomeValue}>
              <OutcomePrice outcome={outcome} />
            </strong>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function SportsLeagueFuturesDashboard({
  payload,
  rootHref,
}: SportsLeagueFuturesDashboardProps) {
  const resolveLeagueHref = (href: string, active?: boolean) =>
    rootHref && active ? rootHref : href;

  return (
    <section className={styles.surface}>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <SportsModeSwitch activeMode="futures" className={styles.modeSwitch} />

          <p className={styles.sidebarLabel}>All Sports</p>
          <nav className={styles.sidebarFeatured} aria-label="Featured futures leagues">
            {payload.sidebarFeatured.map((item) => (
              <SidebarItem
                key={item.slug}
                item={{ ...item, href: resolveLeagueHref(item.href, item.active) }}
              />
            ))}
          </nav>

          <div className={styles.sidebarGroups}>
            {payload.sidebarSections.map((section) => (
              <SidebarSection
                key={section.title}
                section={{
                  ...section,
                  items: section.items.map((item) => ({
                    ...item,
                    href: resolveLeagueHref(item.href, item.active),
                  })),
                }}
              />
            ))}
          </div>
        </aside>

        <div className={styles.board}>
          <header className={styles.header}>
            <div className={styles.headerText}>
              <h1 className={styles.title}>{payload.title}</h1>
              <div className={styles.pills} aria-label="League futures filters">
                {payload.pills.map((pill) => (
                  <Link
                    key={pill.slug}
                    href={resolveLeagueHref(pill.href, pill.active)}
                    className={styles.pill}
                    data-active={pill.active || undefined}
                  >
                    {pill.label}
                  </Link>
                ))}
              </div>
            </div>

            <p className={styles.watermark}>Polymarket</p>
          </header>

          <BarCard card={payload.heroCard} />

          <div className={styles.compactGrid}>
            {payload.compactCards.map((card) => (
              <CompactListCard key={card.slug} card={card} />
            ))}
          </div>

          <div className={styles.barGrid}>
            {payload.barCards.map((card) => (
              <BarCard key={card.slug} card={card} compact />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
