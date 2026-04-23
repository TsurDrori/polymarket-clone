import styles from "./SingleBinaryInfoLine.module.css";

export type SingleBinaryInfoItem =
  | { kind: "live-dot" }
  | { kind: "divider" }
  | { kind: "text"; text: string; tone?: "default" | "live" };

type SingleBinaryInfoLineProps = {
  items: ReadonlyArray<SingleBinaryInfoItem>;
  trailingText?: string;
  trailingTextTone?: "default" | "up" | "down";
  trailingActions?: React.ReactNode;
};

export function SingleBinaryInfoLine({
  items,
  trailingText,
  trailingTextTone = "default",
  trailingActions,
}: SingleBinaryInfoLineProps) {
  return (
    <div className={styles.root}>
      <div className={styles.meta}>
        {items.map((item, index) => {
          switch (item.kind) {
            case "live-dot":
              return <span key={`live-dot:${index}`} className={styles.liveDot} aria-hidden="true" />;
            case "divider":
              return (
                <span key={`divider:${index}`} className={styles.divider} aria-hidden="true">
                  ·
                </span>
              );
            case "text":
              return (
                <span
                  key={`${item.text}:${index}`}
                  className={styles.item}
                  data-tone={item.tone ?? "default"}
                >
                  {item.text}
                </span>
              );
          }
        })}
      </div>

      {trailingActions ? (
        <div className={styles.actions}>{trailingActions}</div>
      ) : trailingText ? (
        <span className={styles.trailingText} data-tone={trailingTextTone}>
          {trailingText}
        </span>
      ) : null}
    </div>
  );
}
