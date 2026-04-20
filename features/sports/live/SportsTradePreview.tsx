import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { formatCents, formatVolume } from "@/shared/lib/format";
import { shouldBypassNextImageOptimization } from "@/shared/lib/images";
import type { SportsbookRowModel } from "@/features/sports/games/parse";
import styles from "./SportsTradePreview.module.css";

type SportsTradePreviewProps = {
  row: SportsbookRowModel;
};

export function SportsTradePreview({ row }: SportsTradePreviewProps) {
  const [homeCompetitor, awayCompetitor] = row.competitors;
  const [homePrice, awayPrice] = row.moneyline;

  if (!homeCompetitor || !awayCompetitor || !homePrice || !awayPrice) {
    return null;
  }

  const renderLogo = (name: string, logo?: string, abbreviation?: string) => {
    if (logo) {
      return (
        <Image
          src={logo}
          alt=""
          width={40}
          height={40}
          className={styles.logo}
          unoptimized={shouldBypassNextImageOptimization(logo)}
        />
      );
    }

    return (
      <span className={styles.fallbackLogo} aria-hidden="true">
        {abbreviation?.slice(0, 3) ?? name.slice(0, 3)}
      </span>
    );
  };

  return (
    <aside className={styles.preview} aria-label="Selected matchup preview">
      <div className={styles.matchupHeader}>
        {renderLogo(homeCompetitor.name, homeCompetitor.logo, homeCompetitor.abbreviation)}
        <div className={styles.matchupCopy}>
          <h2 className={styles.title}>
            {homeCompetitor.name} vs {awayCompetitor.name}
          </h2>
          <span className={styles.badge}>{homeCompetitor.name}</span>
        </div>
      </div>

      <div className={styles.tradeTabs}>
        <button type="button" className={styles.tradeTab} data-active="true">
          Buy
        </button>
        <button type="button" className={styles.tradeTab}>
          Sell
        </button>
        <button type="button" className={styles.marketButton}>
          Market
          <ChevronDown size={16} />
        </button>
      </div>

      <div className={styles.priceRow}>
        <button type="button" className={styles.priceButton} data-active="true">
          {homePrice.label} {formatCents(homePrice.price)}
        </button>
        <button type="button" className={styles.priceButton}>
          {awayPrice.label} {formatCents(awayPrice.price)}
        </button>
      </div>

      <div className={styles.amountBlock}>
        <div className={styles.amountHeader}>
          <span>Amount</span>
          <strong>$0</strong>
        </div>

        <div className={styles.amountOptions}>
          {["+$1", "+$5", "+$10", "+$100", "Max"].map((option) => (
            <button key={option} type="button" className={styles.amountOption}>
              {option}
            </button>
          ))}
        </div>

        <button type="button" className={styles.tradeButton}>
          Trade
        </button>
      </div>

      <p className={styles.footnote}>
        {row.statusLabel} {row.statusDetail ? `${row.statusDetail} · ` : ""}
        {formatVolume(row.eventVolume)} Vol.
      </p>
    </aside>
  );
}
