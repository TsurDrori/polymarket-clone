import { Tab } from "@/shared/ui/Tab";
import styles from "./SportsRouteSwitch.module.css";

type SportsRouteSwitchProps = {
  gamesHref: string;
  propsHref: string;
};

export function SportsRouteSwitch({
  gamesHref,
  propsHref,
}: SportsRouteSwitchProps) {
  return (
    <div className={styles.switch} role="tablist" aria-label="League route">
      <Tab href={gamesHref} className={styles.tab} aria-current="page">
        Games
      </Tab>
      <Tab href={propsHref} className={styles.tab}>
        Props
      </Tab>
    </div>
  );
}
