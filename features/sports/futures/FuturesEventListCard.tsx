import Image from "next/image";
import Link from "next/link";
import { PriceCell } from "@/features/events/components/PriceCell";
import { cn } from "@/shared/lib/cn";
import { formatSportsPct } from "@/shared/lib/format";
import { shouldBypassNextImageOptimization } from "@/shared/lib/images";
import type { SportsCardModel } from "./parse";
import styles from "./FuturesEventListCard.module.css";

type FuturesEventListCardProps = {
  card: SportsCardModel;
  emphasis?: {
    isLiveLeader?: boolean;
    isPromoted?: boolean;
  };
};

const renderPrice = (tokenId: string | null, fallbackPrice: number) =>
  tokenId ? (
    <PriceCell
      tokenId={tokenId}
      formatKind="sportsPct"
      fallbackValue={fallbackPrice}
    />
  ) : (
    formatSportsPct(fallbackPrice)
  );

export function FuturesEventListCard({
  card,
  emphasis,
}: FuturesEventListCardProps) {
  const imageSrc = card.imageSrc ?? "/placeholder.svg";
  const hasMore = card.totalOutcomeCount > card.previewOutcomes.length;

  return (
    <article
      className={cn(
        styles.card,
        emphasis?.isLiveLeader && styles.cardLeader,
        emphasis?.isPromoted && styles.cardPromoted,
      )}
    >
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <div className={styles.iconWrap}>
            <Image
              src={imageSrc}
              alt=""
              fill
              sizes="40px"
              unoptimized={shouldBypassNextImageOptimization(imageSrc)}
              className={styles.icon}
            />
          </div>

          <div className={styles.titleWrap}>
            <h2 className={styles.title}>
              <Link href={card.showMoreHref} className={styles.titleLink}>
                {card.title}
              </Link>
            </h2>
            <p className={styles.meta}>
              {card.volumeLabel}
              {emphasis?.isLiveLeader ? (
                <span className={styles.liveBadge}>Live</span>
              ) : null}
            </p>
          </div>
        </div>

        {hasMore ? (
          <Link href={card.showMoreHref} className={styles.showMoreLink}>
            Show more
          </Link>
        ) : null}
      </header>

      <ul className={styles.outcomeList}>
        {card.previewOutcomes.map((preview) => (
          <li key={preview.id} className={styles.outcomeRow}>
            <span className={styles.outcomeLabel} title={preview.question}>
              {preview.label}
            </span>
            <strong className={styles.outcomePrice}>
              {renderPrice(preview.yesTokenId, preview.yesFallbackPrice)}
            </strong>
          </li>
        ))}
      </ul>
    </article>
  );
}
