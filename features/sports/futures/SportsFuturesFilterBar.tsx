import styles from "./SportsFuturesFilterBar.module.css";

const FILTER_LABELS = ["24hr Volume", "All", "Active"] as const;

export function SportsFuturesFilterBar() {
  return (
    <div className={styles.bar} aria-label="Futures filters">
      {FILTER_LABELS.map((label, index) => (
        <span
          key={label}
          className={styles.pill}
          data-active={index === 0}
        >
          {label}
        </span>
      ))}
    </div>
  );
}
