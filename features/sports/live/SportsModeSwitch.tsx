import clsx from "clsx";
import { Tab } from "@/shared/ui/Tab";
import styles from "./SportsModeSwitch.module.css";

type SportsModeSwitchProps = {
  activeMode: "live" | "futures";
  className?: string;
};

export function SportsModeSwitch({
  activeMode,
  className,
}: SportsModeSwitchProps) {
  return (
    <nav className={clsx(styles.switch, className)} aria-label="Sports mode">
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
    </nav>
  );
}
