import Image from "next/image";
import Link from "next/link";
import { PriceCell } from "@/features/events/components/PriceCell";
import { cn } from "@/shared/lib/cn";
import { formatPct } from "@/shared/lib/format";
import { type CryptoCardModel } from "../parse";
import { CryptoSingleGauge } from "./CryptoSingleGauge";
import styles from "./CryptoCard.module.css";

type CryptoCardProps = {
  card: CryptoCardModel;
  emphasis?: {
    isLiveLeader?: boolean;
    isPromoted?: boolean;
  };
};

const renderSnippetPrice = (tokenId: string | null, fallbackPrice: number) =>
  tokenId ? (
    <PriceCell tokenId={tokenId} formatKind="pct" />
  ) : (
    formatPct(fallbackPrice)
  );

export function CryptoCard({ card, emphasis }: CryptoCardProps) {
  const singleLabel =
    card.family === "up-down"
      ? card.primarySnippet.primaryOutcomeLabel
      : card.primarySnippet.primaryOutcomeLabel === "Yes"
        ? "Chance"
        : card.primarySnippet.primaryOutcomeLabel;

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
      <Link href={`/event/${card.slug}`} className={styles.link}>
        <header className={styles.header}>
          <div className={styles.titleRow}>
            <div className={styles.iconWrap}>
              {card.imageSrc ? (
                <Image
                  src={card.imageSrc}
                  alt=""
                  fill
                  sizes="48px"
                  className={styles.icon}
                />
              ) : (
                <span className={styles.iconFallback}>
                  {card.title.slice(0, 1)}
                </span>
              )}
            </div>
            <h2 className={styles.title}>{card.title}</h2>
          </div>

          {card.variant === "single" ? (
            <CryptoSingleGauge
              label={singleLabel}
              fallbackPrice={card.primarySnippet.fallbackPrice}
              tokenId={card.primarySnippet.tokenId}
            />
          ) : null}
        </header>

        {card.variant === "single" ? (
          <div className={styles.singleBody}>
            <div className={styles.outcomeRow}>
              <span className={cn(styles.outcomePill, styles.outcomeYes)}>
                {card.primarySnippet.primaryOutcomeLabel}
              </span>
              <span className={cn(styles.outcomePill, styles.outcomeNo)}>
                {card.primarySnippet.secondaryOutcomeLabel}
              </span>
            </div>
          </div>
        ) : (
          <div className={styles.listBody}>
            {card.snippets.map((snippet) => (
              <div key={snippet.id} className={styles.snippetRow}>
                <span className={styles.snippetLabel}>{snippet.label}</span>
                <strong className={styles.snippetPrice}>
                  {renderSnippetPrice(snippet.tokenId, snippet.fallbackPrice)}
                </strong>
                <div className={styles.snippetActions} aria-hidden="true">
                  <span className={cn(styles.actionBadge, styles.actionYes)}>
                    {snippet.primaryOutcomeLabel}
                  </span>
                  <span className={cn(styles.actionBadge, styles.actionNo)}>
                    {snippet.secondaryOutcomeLabel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <footer className={styles.meta}>
          <div className={styles.metaLead}>
            {card.showLiveDot ? <span className={styles.liveDot} aria-hidden="true" /> : null}
            {card.showLiveDot ? <span className={styles.liveLabel}>Live</span> : null}
            <span>{card.volumeLabel}</span>
          </div>
          {card.metaLabel ? <span>{card.metaLabel}</span> : null}
        </footer>
      </Link>
    </article>
  );
}
