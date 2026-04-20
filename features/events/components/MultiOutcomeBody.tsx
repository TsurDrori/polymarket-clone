import type { EventCardGroupedModel } from "./eventCardModel";
import { PriceCell } from "./PriceCell";
import { OutcomePill } from "./OutcomePill";
import styles from "./MultiOutcomeBody.module.css";

type MultiOutcomeBodyProps = {
  model: EventCardGroupedModel;
};

export function MultiOutcomeBody({ model }: MultiOutcomeBodyProps) {
  return (
    <div className={styles.root}>
      {model.rows.map((row) => (
        <div key={row.id} className={styles.row}>
          <div className={styles.labelWrap}>
            <div className={styles.label} title={row.label}>
              {row.label}
            </div>
            <div className={styles.price}>
              {row.probabilityTokenId ? (
                <PriceCell
                  tokenId={row.probabilityTokenId}
                  formatKind="pct"
                  fallbackValue={row.probabilityFallback}
                />
              ) : (
                <span>{Math.round(row.probabilityFallback * 100)}%</span>
              )}
            </div>
          </div>

          <div className={styles.actions}>
            {row.actions.map((action) => (
              <OutcomePill
                key={`${row.id}-${action.tone}`}
                tone={action.tone}
                label={action.label}
                tokenId={action.tokenId}
                fallbackPrice={action.fallbackPrice}
                compact
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
