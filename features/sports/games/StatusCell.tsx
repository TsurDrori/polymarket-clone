import type { SportsbookRowModel } from "./parse";
import styles from "./StatusCell.module.css";

type StatusCellProps = {
  row: SportsbookRowModel;
};

export function StatusCell({ row }: StatusCellProps) {
  return (
    <div className={styles.cell}>
      <span className={styles.primary}>{row.statusLabel}</span>
      {row.statusDetail ? <span className={styles.secondary}>{row.statusDetail}</span> : null}
      <span className={styles.volume}>{row.volumeLabel}</span>
    </div>
  );
}
