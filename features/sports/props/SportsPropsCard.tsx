import Image from "next/image";
import Link from "next/link";
import { PriceCell } from "@/features/events/components/PriceCell";
import { formatSportsPct } from "@/shared/lib/format";
import type { SportsCardModel } from "@/features/sports/futures/parse";
import styles from "./SportsPropsCard.module.css";

type SportsPropsCardProps = {
  card: SportsCardModel;
};

const renderPrice = (tokenId: string | null, fallbackPrice: number) =>
  tokenId ? (
    <PriceCell tokenId={tokenId} formatKind="sportsPct" />
  ) : (
    formatSportsPct(fallbackPrice)
  );

export function SportsPropsCard({ card }: SportsPropsCardProps) {
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
      </header>

      <div className={styles.marketList}>
        {card.previewOutcomes.map((preview) => (
          <div key={preview.id} className={styles.marketCard}>
            <div className={styles.marketTop}>
              <span className={styles.marketLabel} title={preview.question}>
                {preview.label}
              </span>
              <strong className={styles.marketPrice}>
                {renderPrice(preview.yesTokenId, preview.yesFallbackPrice)}
              </strong>
            </div>

            <div className={styles.actionRow}>
              <span className={styles.actionYes}>
                Yes {renderPrice(preview.yesTokenId, preview.yesFallbackPrice)}
              </span>
              <span className={styles.actionNo}>
                No {renderPrice(preview.noTokenId, preview.noFallbackPrice)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <footer className={styles.footer}>
        <span>{card.previewOutcomes.length} preview markets</span>
        {hasMore ? (
          <Link href={card.showMoreHref} className={styles.showMoreLink}>
            Show more
          </Link>
        ) : null}
      </footer>
    </article>
  );
}
