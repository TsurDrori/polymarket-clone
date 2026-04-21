"use client";

import Image from "next/image";
import Link from "next/link";
import { Bookmark, Link2 } from "lucide-react";
import { PriceCell } from "@/features/events/components/PriceCell";
import { CryptoSingleGauge } from "@/features/crypto/components/CryptoSingleGauge";
import { cn } from "@/shared/lib/cn";
import { formatPct } from "@/shared/lib/format";
import { shouldBypassNextImageOptimization } from "@/shared/lib/images";
import type { SurfaceFeedLayoutVariant } from "@/features/events/feed/types";
import type {
  HomeBinaryCardModel,
  HomeCardModel,
  HomeGroupedCardModel,
  HomeSportsLiveCardModel,
} from "./homeCardModel";
import styles from "./HomeMarketGrid.module.css";

type HomeMarketCardProps = {
  model: HomeCardModel;
  emphasis?: {
    isLiveLeader?: boolean;
    isPromoted?: boolean;
  };
  layoutVariant: SurfaceFeedLayoutVariant;
};

type HomeCardFrameProps = {
  href: string;
  imageSrc: string;
  metaLabels: string[];
  title: string;
  emphasis?: HomeMarketCardProps["emphasis"];
  layoutVariant: SurfaceFeedLayoutVariant;
  children: React.ReactNode;
};

const renderPct = (tokenId: string | undefined, fallbackPrice: number) =>
  tokenId ? (
    <PriceCell tokenId={tokenId} formatKind="pct" fallbackValue={fallbackPrice} />
  ) : (
    formatPct(fallbackPrice)
  );

function HomeCardFrame({
  href,
  imageSrc,
  metaLabels,
  title,
  emphasis,
  layoutVariant,
  children,
}: HomeCardFrameProps) {
  return (
    <Link
      href={href}
      className={cn(
        styles.card,
        emphasis?.isLiveLeader && styles.cardLeader,
        emphasis?.isPromoted && styles.cardPromoted,
        layoutVariant === "wide" && styles.cardWide,
        layoutVariant === "compact" && styles.cardCompact,
      )}
    >
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div className={styles.mediaWrap}>
            <Image
              src={imageSrc}
              alt=""
              fill
              sizes="18px"
              unoptimized={shouldBypassNextImageOptimization(imageSrc)}
              className={styles.media}
            />
          </div>

          <div className={styles.titleStack}>
            <div className={styles.metaRow}>
              {metaLabels.map((label, index) => (
                <span key={`${label}:${index}`}>{label}</span>
              ))}
              {emphasis?.isLiveLeader ? (
                <span className={styles.liveBadge}>Live</span>
              ) : null}
            </div>
            <h3 className={styles.title}>{title}</h3>
          </div>
        </div>

        <div className={styles.utilityIcons} aria-hidden="true">
          <Link2 size={12} strokeWidth={1.9} />
          <Bookmark size={12} strokeWidth={1.9} />
        </div>
      </div>

      {children}
    </Link>
  );
}

function HomeBinaryCardBody({ model }: { model: HomeBinaryCardModel }) {
  return (
    <>
      <div className={styles.binarySummary}>
        <div className={styles.priceStack}>
          <span className={styles.priceValue}>
            {renderPct(model.primaryTokenId, model.primaryPrice)}
          </span>
          <span className={styles.priceLabel}>chance</span>
          <span
            className={cn(
              styles.changeLabel,
              model.primaryChange >= 0 ? styles.changeUp : styles.changeDown,
            )}
          >
            {`${model.primaryChange >= 0 ? "+" : "-"}${Math.round(
              Math.abs(model.primaryChange) * 100,
            )}%`}
          </span>
        </div>

        <div className={styles.footerMeta}>
          {model.primaryDateLabel ? <span>{model.primaryDateLabel}</span> : null}
          <span>{model.volumeLabel}</span>
        </div>
      </div>

      <div className={styles.binaryActions}>
        {model.actions.map((action, index) => (
          <span
            key={`${action.label}:${index}`}
            className={cn(
              styles.binaryActionPill,
              index === 0 ? styles.actionYes : styles.actionNo,
            )}
          >
            <span>{action.label}</span>
            <span className={styles.binaryActionValue}>{formatPct(action.price)}</span>
          </span>
        ))}
      </div>
    </>
  );
}

function HomeGroupedCardBody({ model }: { model: HomeGroupedCardModel }) {
  return (
    <>
      <div className={styles.rows}>
        {model.rows.map((row) => (
          <div key={row.id} className={styles.row}>
            <span className={styles.rowLabel}>{row.label}</span>
            <div className={styles.rowMeta}>
              <span className={styles.rowValue}>{renderPct(row.tokenId, row.price)}</span>
              <div className={styles.rowActions}>
                {row.actions.map((action, index) => (
                  <span
                    key={`${row.id}:${action.label}`}
                    className={cn(
                      styles.actionPill,
                      index === 0 ? styles.actionYes : styles.actionNo,
                    )}
                  >
                    <span>{action.label}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.footerMeta}>
        {model.primaryDateLabel ? <span>{model.primaryDateLabel}</span> : null}
        <span>{model.volumeLabel}</span>
      </div>
    </>
  );
}

function HomeCryptoCardBody({
  model,
}: {
  model: Extract<HomeCardModel, { kind: "crypto-up-down" }>;
}) {
  return (
    <>
      <div className={styles.cryptoGaugeRow}>
        <CryptoSingleGauge
          label="Up"
          fallbackPrice={model.price}
          tokenId={model.tokenId ?? null}
        />
        <div className={styles.cryptoMeta}>
          <span className={styles.cryptoLabel}>{model.liveLabel}</span>
          <span>{model.volumeLabel}</span>
        </div>
      </div>

      <div className={styles.binaryActions}>
        {model.actions.map((action, index) => (
          <span
            key={`${action.label}:${index}`}
            className={cn(
              styles.binaryActionPill,
              index === 0 ? styles.actionYes : styles.actionNo,
            )}
          >
            <span>{action.label}</span>
            <span className={styles.binaryActionValue}>{formatPct(action.price)}</span>
          </span>
        ))}
      </div>
    </>
  );
}

function HomeSportsLiveCardBody({ model }: { model: HomeSportsLiveCardModel }) {
  return (
    <>
      <div className={styles.sportsRows}>
        {model.competitors.map((competitor) => (
          <div key={competitor.key} className={styles.sportsRow}>
            <div className={styles.sportsTeam}>
              <span className={styles.sportsTeamName}>{competitor.name}</span>
              {competitor.subtitle ? (
                <span className={styles.sportsTeamMeta}>{competitor.subtitle}</span>
              ) : null}
            </div>
            <span className={styles.sportsPrice}>
              {renderPct(competitor.tokenId, competitor.price)}
            </span>
          </div>
        ))}
      </div>

      <div className={styles.binaryActions}>
        {model.competitors.slice(0, 2).map((competitor, index) => (
          <span
            key={`${competitor.key}:action`}
            className={cn(
              styles.binaryActionPill,
              index === 0 ? styles.actionYes : styles.actionNo,
            )}
          >
            <span>{competitor.name}</span>
          </span>
        ))}
      </div>

      <div className={styles.footerMeta}>
        <span>{model.statusLabel}</span>
        {model.statusDetail ? <span>{model.statusDetail}</span> : null}
        <span>{model.volumeLabel}</span>
      </div>
    </>
  );
}

export function HomeMarketCard({
  model,
  emphasis,
  layoutVariant,
}: HomeMarketCardProps) {
  const sharedProps = {
    href: model.href,
    imageSrc: model.imageSrc,
    metaLabels: model.metaLabels,
    title: model.title,
    emphasis,
    layoutVariant,
  };

  switch (model.kind) {
    case "binary":
      return (
        <HomeCardFrame {...sharedProps}>
          <HomeBinaryCardBody model={model} />
        </HomeCardFrame>
      );
    case "grouped":
      return (
        <HomeCardFrame {...sharedProps}>
          <HomeGroupedCardBody model={model} />
        </HomeCardFrame>
      );
    case "crypto-up-down":
      return (
        <HomeCardFrame {...sharedProps}>
          <HomeCryptoCardBody model={model} />
        </HomeCardFrame>
      );
    case "sports-live":
      return (
        <HomeCardFrame {...sharedProps}>
          <HomeSportsLiveCardBody model={model} />
        </HomeCardFrame>
      );
  }
}
