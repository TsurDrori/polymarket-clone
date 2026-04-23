import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import styles from "./BinarySingleCardFrame.module.css";

type BinarySingleCardFrameProps = {
  href: string;
  primarySlot: React.ReactNode;
  secondarySlot?: React.ReactNode;
  actionsSlot: React.ReactNode;
  footerSlot: React.ReactNode;
  primarySpansSecondary?: boolean;
  emphasis?: {
    isLiveLeader?: boolean;
    isPromoted?: boolean;
  };
};

export function BinarySingleCardFrame({
  href,
  primarySlot,
  secondarySlot,
  actionsSlot,
  footerSlot,
  primarySpansSecondary = false,
  emphasis,
}: BinarySingleCardFrameProps) {
  return (
    <article
      className={cn(
        styles.card,
        emphasis?.isLiveLeader && styles.cardLeader,
        emphasis?.isPromoted && styles.cardPromoted,
      )}
      data-live-leader={emphasis?.isLiveLeader ? "true" : "false"}
      data-promoted={emphasis?.isPromoted ? "true" : "false"}
    >
      <Link href={href} className={styles.link}>
        <div
          className={cn(
            styles.primary,
            primarySpansSecondary && styles.primaryExpanded,
          )}
        >
          {primarySlot}
        </div>
        {!primarySpansSecondary ? (
          <div className={styles.secondary}>{secondarySlot}</div>
        ) : null}
        <div className={styles.actions}>{actionsSlot}</div>
        <div className={styles.footer}>{footerSlot}</div>
      </Link>
    </article>
  );
}
