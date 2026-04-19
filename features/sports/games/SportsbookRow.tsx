import type { SportsbookRowModel } from "./parse";
import { CompetitorsCell } from "./CompetitorsCell";
import { MoneylineCell } from "./MoneylineCell";
import { SpreadCell } from "./SpreadCell";
import { StatusCell } from "./StatusCell";
import { TotalCell } from "./TotalCell";
import styles from "./SportsbookRow.module.css";

type SportsbookRowProps = {
  row: SportsbookRowModel;
};

export function SportsbookRow({ row }: SportsbookRowProps) {
  return (
    <div className={styles.row}>
      <StatusCell row={row} />
      <CompetitorsCell competitors={row.competitors} />
      <MoneylineCell entries={row.moneyline} />
      <SpreadCell entries={row.spread} />
      <TotalCell entries={row.total} />
    </div>
  );
}
