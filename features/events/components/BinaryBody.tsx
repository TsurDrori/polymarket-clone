import type { EventCardBinaryModel } from "./eventCardModel";
import { PriceCell } from "./PriceCell";
import { OutcomePill } from "./OutcomePill";
import styles from "./BinaryBody.module.css";

type BinaryBodyProps = {
  model: EventCardBinaryModel;
};

export function BinaryBody({ model }: BinaryBodyProps) {
  return (
    <div className={styles.root}>
      <div className={styles.headline}>
        {model.probabilityTokenId ? (
          <PriceCell
            tokenId={model.probabilityTokenId}
            formatKind="pct"
            fallbackValue={model.probabilityFallback}
            className={styles.headlinePrice}
          />
        ) : (
          <span className={styles.headlinePrice}>
            {Math.round(model.probabilityFallback * 100)}%
          </span>
        )}
      </div>

      <div className={styles.actions}>
        {model.actions.map((action) => (
          <OutcomePill
            key={action.tone}
            tone={action.tone}
            label={action.label}
            tokenId={action.tokenId}
            fallbackPrice={action.fallbackPrice}
          />
        ))}
      </div>
    </div>
  );
}
