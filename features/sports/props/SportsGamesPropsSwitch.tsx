import { Tab } from "@/shared/ui/Tab";
import styles from "./SportsGamesPropsSwitch.module.css";

type SportsGamesPropsSwitchProps = {
  gamesHref: string;
  propsHref: string;
  activeRoute: "games" | "props";
};

export function SportsGamesPropsSwitch({
  gamesHref,
  propsHref,
  activeRoute,
}: SportsGamesPropsSwitchProps) {
  return (
    <nav className={styles.switch} aria-label="League route">
      <Tab
        href={gamesHref}
        className={styles.tab}
        aria-current={activeRoute === "games" ? "page" : undefined}
      >
        Games
      </Tab>
      <Tab
        href={propsHref}
        className={styles.tab}
        aria-current={activeRoute === "props" ? "page" : undefined}
      >
        Props
      </Tab>
    </nav>
  );
}
