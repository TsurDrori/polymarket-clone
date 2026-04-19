import Link from "next/link";
import type { SportsbookSectionModel } from "./parse";
import { SportsbookRow } from "./SportsbookRow";
import styles from "./SportsbookSection.module.css";

type SportsbookSectionProps = {
  section: SportsbookSectionModel;
};

export function SportsbookSection({ section }: SportsbookSectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <h2 className={styles.title}>{section.title}</h2>
          {section.meta ? <p className={styles.meta}>{section.meta}</p> : null}
        </div>

        {section.href && section.actionLabel ? (
          <Link href={section.href} className={styles.link}>
            {section.actionLabel}
          </Link>
        ) : null}
      </div>

      <div className={styles.tableHeader}>
        <span>Game</span>
        <span>Moneyline</span>
        <span>Spread</span>
        <span>Total</span>
      </div>

      <div className={styles.rows}>
        {section.rows.map((row) => (
          <SportsbookRow key={row.id} row={row} />
        ))}
      </div>
    </section>
  );
}
