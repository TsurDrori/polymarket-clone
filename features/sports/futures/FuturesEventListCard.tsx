import Image from "next/image";
import Link from "next/link";
import { PriceCell } from "@/features/events/components/PriceCell";
import { formatSportsPct } from "@/shared/lib/format";
import type { SportsCardModel } from "./parse";
import styles from "./FuturesEventListCard.module.css";

type FuturesEventListCardProps = {
  card: SportsCardModel;
};

const renderPrice = (tokenId: string | null, fallbackPrice: number) =>
  tokenId ? (
    <PriceCell tokenId={tokenId} formatKind="sportsPct" />
  ) : (
    formatSportsPct(fallbackPrice)
  );

export function FuturesEventListCard({ card }: FuturesEventListCardProps) {
  const imageSrc = card.imageSrc ?? "/placeholder.svg";
  const hasMore = card.totalOutcomeCount > card.previewOutcomes.length;

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <div className={styles.iconWrap}>
            <Image
              src={imageSrc}
              alt=""
              fill
              sizes="40px"
              className={styles.icon}
            />
          </div>

          <div className={styles.titleWrap}>
            <h2 className={styles.title}>
              <Link href={card.showMoreHref} className={styles.titleLink}>
                {card.title}
              </Link>
            </h2>
            <p className={styles.meta}>{card.volumeLabel}</p>
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
