import Image from "next/image";
import Link from "next/link";
import { GroupedOutcomeRows, type GroupedOutcomeRow } from "./GroupedOutcomeRows";
import { cn } from "@/shared/lib/cn";
import { shouldBypassNextImageOptimization } from "@/shared/lib/images";
import styles from "./BinaryGroupCard.module.css";

type BinaryGroupCardProps = {
  title: string;
  href: string;
  imageSrc: string | null;
  rows: ReadonlyArray<GroupedOutcomeRow>;
  volumeLabel: string;
  metaLabel?: string | null;
  showLiveDot?: boolean;
  liveLabel?: string;
  emphasis?: {
    isLiveLeader?: boolean;
    isPromoted?: boolean;
  };
};

export function BinaryGroupCard({
  title,
  href,
  imageSrc,
  rows,
  volumeLabel,
  metaLabel,
  showLiveDot = false,
  liveLabel = "Live",
  emphasis,
}: BinaryGroupCardProps) {
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
        <header className={styles.header}>
          <div className={styles.titleRow}>
            <div className={styles.iconWrap}>
              {imageSrc ? (
                <Image
                  src={imageSrc}
                  alt=""
                  fill
                  sizes="48px"
                  unoptimized={shouldBypassNextImageOptimization(imageSrc)}
                  className={styles.icon}
                />
              ) : (
                <span className={styles.iconFallback}>{title.slice(0, 1)}</span>
              )}
            </div>
            <h2 className={styles.title}>{title}</h2>
          </div>
        </header>

        <div className={styles.body}>
          <GroupedOutcomeRows rows={rows} />
        </div>

        <footer className={styles.meta}>
          <div className={styles.metaLead}>
            {showLiveDot ? <span className={styles.liveDot} aria-hidden="true" /> : null}
            {showLiveDot ? <span className={styles.liveLabel}>{liveLabel}</span> : null}
            <span>{volumeLabel}</span>
          </div>
          {metaLabel ? <span>{metaLabel}</span> : null}
        </footer>
      </Link>
    </article>
  );
}
