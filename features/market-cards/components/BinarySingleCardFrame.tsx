import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import styles from "./BinarySingleCardFrame.module.css";

type BinarySingleCardFrameProps = {
  href: string;
  overlaySlot?: React.ReactNode;
  primarySlot: React.ReactNode;
  secondarySlot?: React.ReactNode;
  actionsSlot: React.ReactNode;
  footerSlot: React.ReactNode;
  primarySpansSecondary?: boolean;
  cardClassName?: string;
  emphasis?: {
    isLiveLeader?: boolean;
    isPromoted?: boolean;
  };
};

export function BinarySingleCardFrame({
  href,
  overlaySlot,
  primarySlot,
  secondarySlot,
  actionsSlot,
  footerSlot,
  primarySpansSecondary = false,
  cardClassName,
  emphasis,
}: BinarySingleCardFrameProps) {
  return (
    <article
      className={cn(
        styles.card,
        cardClassName,
        emphasis?.isLiveLeader && styles.cardLeader,
        emphasis?.isPromoted && styles.cardPromoted,
      )}
      data-live-leader={emphasis?.isLiveLeader ? "true" : "false"}
      data-promoted={emphasis?.isPromoted ? "true" : "false"}
    >
      {overlaySlot ? <div className={styles.overlay}>{overlaySlot}</div> : null}
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
