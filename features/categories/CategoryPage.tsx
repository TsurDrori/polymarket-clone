import { EventGrid } from "@/features/events/components/EventGrid";
import styles from "./CategoryPage.module.css";
import type { PolymarketEvent } from "../events/types";

export type CategoryFacet = {
  slug: string;
  label: string;
  meta?: string;
};

export type CategorySection = {
  id: string;
  title: string;
  description?: string;
  events: ReadonlyArray<PolymarketEvent>;
};

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  facets?: ReadonlyArray<CategoryFacet>;
  sections?: ReadonlyArray<CategorySection>;
  events?: ReadonlyArray<PolymarketEvent>;
  marketTitle?: string;
  marketDescription?: string;
  emptyMessage?: string;
};

export function CategoryPage({
  eyebrow = "Category",
  title,
  description,
  facets = [],
  sections = [],
  events = [],
  marketTitle = "All markets",
  marketDescription = "Active markets sorted by 24-hour volume.",
  emptyMessage = "No markets to show right now.",
}: Props) {
  const visibleSections = sections.filter((section) => section.events.length > 0);
  const hasContent = visibleSections.length > 0 || events.length > 0;

  if (!hasContent) {
    return (
      <main className={styles.main}>
        <p className={styles.empty}>{emptyMessage}</p>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>{eyebrow}</p>
          <h1 className={styles.title}>{title}</h1>
        </div>
        {description ? <p className={styles.description}>{description}</p> : null}
      </header>

      {facets.length > 0 ? (
        <ul className={styles.facetList}>
          {facets.map((facet) => (
            <li key={facet.slug} className={styles.facetPill}>
              <span>{facet.label}</span>
              {facet.meta ? <span className={styles.facetMeta}>{facet.meta}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}

      {visibleSections.map((section) => (
        <section key={section.id} className={styles.surfaceSection}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>{section.title}</h2>
              {section.description ? (
                <p className={styles.sectionDescription}>{section.description}</p>
              ) : null}
            </div>
            <span className={styles.sectionMeta}>{section.events.length} markets</span>
          </div>
          <EventGrid events={section.events} />
        </section>
      ))}

      {events.length > 0 ? (
        <section className={styles.surfaceSection}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>{marketTitle}</h2>
              {marketDescription ? (
                <p className={styles.sectionDescription}>{marketDescription}</p>
              ) : null}
            </div>
            <span className={styles.sectionMeta}>{events.length} markets</span>
          </div>
          <EventGrid events={events} />
        </section>
      ) : null}
    </main>
  );
}
