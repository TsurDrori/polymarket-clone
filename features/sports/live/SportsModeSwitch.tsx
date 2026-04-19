import { Tab } from "@/shared/ui/Tab";
import styles from "./SportsModeSwitch.module.css";

type SportsModeSwitchProps = {
  activeMode: "live" | "futures";
};

export function SportsModeSwitch({ activeMode }: SportsModeSwitchProps) {
  return (
    <div className={styles.switch} role="tablist" aria-label="Sports mode">
      <Tab
        href="/sports/live"
        className={styles.tab}
        aria-current={activeMode === "live" ? "page" : undefined}
      >
        Live
      </Tab>
      <Tab
        href="/sports/futures"
        className={styles.tab}
        aria-current={activeMode === "futures" ? "page" : undefined}
      >
        Futures
      </Tab>
    </div>
  );
}
