import Link from "next/link";
import { Bookmark, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import type { HomePageModel } from "./selectors";
import { CompactHeroDiscovery } from "./components/CompactHeroDiscovery";
import { HomeHero } from "./components/HomeHero";
import { HomeMarketGrid } from "./components/HomeMarketGrid";
import styles from "./HomePage.module.css";

type HomePageProps = {
  model: HomePageModel;
};

export function HomePage({ model }: HomePageProps) {
  return (
    <div className={styles.root}>
      <HomeHero hero={model.hero} />
      <CompactHeroDiscovery chips={model.hero.contextChips} />

      <section
        id="markets"
        className={styles.marketSection}
        aria-labelledby="markets-heading"
      >
        <div className={styles.sectionHeader}>
          <div>
            <h2 id="markets-heading" className={styles.subheading}>
              All markets
            </h2>
          </div>
          <div className={styles.marketTools}>
            <button type="button" className={styles.toolButton} aria-label="Search markets">
              <Search size={18} />
            </button>
            <button type="button" className={styles.toolButton} aria-label="Filter markets">
              <SlidersHorizontal size={18} />
            </button>
            <button type="button" className={styles.toolButton} aria-label="Saved markets">
              <Bookmark size={18} />
            </button>
          </div>
        </div>

        <div className={styles.marketChipRow}>
          {model.marketChips.map((chip, index) =>
            chip.href ? (
              <Link
                key={chip.slug}
                href={chip.href}
                className={`${styles.marketChip} ${
                  index === 0 ? styles.marketChipActive : ""
                }`.trim()}
              >
                {chip.label}
              </Link>
            ) : (
              <span
                key={chip.slug}
                className={`${styles.marketChip} ${
                  index === 0 ? styles.marketChipActive : ""
                }`.trim()}
              >
                {chip.label}
              </span>
            ),
          )}
          <span className={styles.marketChipArrow}>
            <ChevronRight size={18} />
          </span>
        </div>

        <HomeMarketGrid events={model.exploreEvents} initialCount={16} incrementCount={8} />
      </section>
    </div>
  );
}
