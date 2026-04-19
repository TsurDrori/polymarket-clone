import { EventGrid } from "@/features/events/components/EventGrid";
import type { HomePageModel } from "./selectors";
import { CompactHeroDiscovery } from "./components/CompactHeroDiscovery";
import { HomeHero } from "./components/HomeHero";
import styles from "./HomePage.module.css";

type HomePageProps = {
  model: HomePageModel;
};

export function HomePage({ model }: HomePageProps) {
  return (
    <div className={styles.root}>
      <HomeHero hero={model.hero} />
      <CompactHeroDiscovery chips={model.hero.contextChips} />

      <section className={styles.marketSection} aria-labelledby="all-markets">
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>Explore</p>
            <h2 id="all-markets" className={styles.subheading}>
              All markets
            </h2>
          </div>
          <p className={styles.sectionCopy}>
            Dense market cards stay directly below the spotlight surface to match
            the live homepage discovery flow.
          </p>
        </div>

        <EventGrid
          events={model.exploreEvents}
          initialCount={18}
          incrementCount={12}
        />
      </section>
    </div>
  );
}
