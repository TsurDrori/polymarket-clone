import type { HomeHeroModel } from "../selectors";
import { HeroFooterNav } from "./HeroFooterNav";
import { HeroRightRail } from "./HeroRightRail";
import { HeroSpotlightCard } from "./HeroSpotlightCard";
import styles from "./HomeHero.module.css";

type HomeHeroProps = {
  hero: HomeHeroModel;
};

export function HomeHero({ hero }: HomeHeroProps) {
  if (!hero.spotlight) {
    return null;
  }

  return (
    <section className={styles.desktopHero} aria-label="Homepage spotlight">
      <div className={styles.heroRow}>
        <HeroSpotlightCard spotlight={hero.spotlight} />
        <HeroRightRail hero={hero} />
      </div>
      <HeroFooterNav chips={hero.contextChips} />
    </section>
  );
}
