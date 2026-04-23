import { PriceCell } from "@/features/events/components/PriceCell";
import { isYesNoOutcomeLabel } from "@/shared/lib/outcomes";
import { OutcomeActionContent } from "./OutcomeActionContent";
import styles from "./GroupedOutcomeRows.module.css";

export type GroupedOutcomeRowAction = {
  label: string;
  tone: "yes" | "no";
  tokenId?: string;
  fallbackPrice?: number;
};

export type GroupedOutcomeRow = {
  id: string;
  label: string;
  probabilityTokenId?: string;
  probabilityFallback: number;
  actions: [GroupedOutcomeRowAction, GroupedOutcomeRowAction];
};

type GroupedOutcomeRowsProps = {
  rows: ReadonlyArray<GroupedOutcomeRow>;
};

export function GroupedOutcomeRows({ rows }: GroupedOutcomeRowsProps) {
  return (
    <div className={styles.root}>
      {rows.map((row) => (
        <div key={row.id} className={styles.row}>
          <div className={styles.labelWrap}>
            <div className={styles.label} title={row.label}>
              {row.label}
            </div>
          </div>

          <div className={styles.meta}>
            <span className={styles.value}>
              {row.probabilityTokenId ? (
                <PriceCell
                  tokenId={row.probabilityTokenId}
                  formatKind="pct"
                  fallbackValue={row.probabilityFallback}
                />
              ) : (
                <span>{Math.round(row.probabilityFallback * 100)}%</span>
              )}
            </span>
            <div className={styles.actions}>
              {row.actions.map((action) => (
                <span
                  key={`${row.id}-${action.tone}`}
                  className={`${styles.action} ${
                    action.tone === "yes" ? styles.actionYes : styles.actionNo
                  }`}
                >
                  <OutcomeActionContent
                    label={action.label}
                    tokenId={action.tokenId}
                    fallbackPrice={action.fallbackPrice}
                    showPriceOnHover={isYesNoOutcomeLabel(action.label)}
                  />
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
