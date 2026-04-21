"use client";

import { Bookmark, Gift } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PriceCell } from "@/features/events/components/PriceCell";
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

const renderPct = (tokenId: string | undefined, fallbackPrice: number) =>
  tokenId ? (
    <PriceCell tokenId={tokenId} formatKind="pct" fallbackValue={fallbackPrice} />
  ) : (
    formatPct(fallbackPrice)
  );

const CRYPTO_ASSET_SYMBOLS: Record<string, string> = {
  Bitcoin: "BTC",
  Ethereum: "ETH",
  Solana: "SOL",
  Dogecoin: "DOGE",
  BNB: "BNB",
  XRP: "XRP",
  Microstrategy: "MSTR",
};

const describeArc = (value: number): string => {
  const radius = 24;
  const clamped = Math.max(0, Math.min(1, value));
  const startAngle = Math.PI;
  const endAngle = Math.PI * (1 - clamped);
  const startX = radius * Math.cos(startAngle);
  const startY = radius * Math.sin(startAngle);
  const endX = radius * Math.cos(endAngle);
  const endY = radius * Math.sin(endAngle);
  const largeArcFlag = clamped > 0.5 ? 1 : 0;

  return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
};

function CardLink({
  href,
  kind,
  emphasis,
  layoutVariant,
  children,
}: {
  href: string;
  kind: HomeCardModel["kind"];
  emphasis?: HomeMarketCardProps["emphasis"];
  layoutVariant: SurfaceFeedLayoutVariant;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        styles.card,
        kind === "grouped" && styles.cardGrouped,
        kind === "binary" && styles.cardBinary,
        kind === "crypto-up-down" && styles.cardCrypto,
        kind === "sports-live" && styles.cardSports,
        emphasis?.isLiveLeader && styles.cardLeader,
        emphasis?.isPromoted && styles.cardPromoted,
        layoutVariant === "wide" && styles.cardWide,
        layoutVariant === "compact" && styles.cardCompact,
      )}
    >
      {children}
    </Link>
  );
}

function CardThumb({
  imageSrc,
  title,
  className,
}: {
  imageSrc: string;
  title: string;
  className?: string;
}) {
  return (
    <div className={cn(styles.mediaWrap, className)}>
      <Image
        src={imageSrc}
        alt=""
        fill
        sizes="38px"
        unoptimized={shouldBypassNextImageOptimization(imageSrc)}
        className={styles.media}
      />
      <span className="sr-only">{title}</span>
    </div>
  );
}

const splitEventTitle = (
  title: string,
): {
  headline: string;
  detail: string | null;
} => {
  const [headline, ...rest] = title.split(" - ");
  return {
    headline: headline.trim(),
    detail: rest.length > 0 ? rest.join(" - ").trim() : null,
  };
};

const formatChanceDelta = (value: number): string => {
  if (!Number.isFinite(value) || value === 0) {
    return "0%";
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${formatPct(value).replace("%", "")}%`;
};

const parseIntervalMinutes = (detail: string | null): number | null => {
  if (!detail) return null;

  const match = detail.match(/(\d{1,2})(?::(\d{2}))?(AM|PM)-(\d{1,2})(?::(\d{2}))?(AM|PM)/i);
  if (!match) return null;

  const toMinutes = (hourText: string, minuteText: string | undefined, meridiem: string) => {
    const rawHour = Number(hourText);
    const minute = Number(minuteText ?? "0");
    const hour = rawHour % 12 + (meridiem.toUpperCase() === "PM" ? 12 : 0);
    return hour * 60 + minute;
  };

  const start = toMinutes(match[1], match[2], match[3]);
  const end = toMinutes(match[4], match[5], match[6]);
  const diff = end - start;

  return diff > 0 ? diff : null;
};

const buildCryptoHeadline = (
  headline: string,
  detail: string | null,
  assetLabel?: string,
): string => {
  if (!assetLabel || headline !== `${assetLabel} Up or Down`) {
    return headline;
  }

  const intervalMinutes = parseIntervalMinutes(detail);
  if (!intervalMinutes) {
    return headline.replace(assetLabel, CRYPTO_ASSET_SYMBOLS[assetLabel] ?? assetLabel);
  }

  const assetSymbol = CRYPTO_ASSET_SYMBOLS[assetLabel] ?? assetLabel;
  return `${assetSymbol} ${intervalMinutes} Minute Up or Down`;
};

function CryptoProbabilityWidget({
  price,
  label,
  tokenId,
}: {
  price: number;
  label: string;
  tokenId?: string;
}) {
  const clamped = Math.max(0, Math.min(1, price));

  return (
    <div className={styles.cryptoWidget} aria-hidden="true">
      <div className={styles.cryptoWidgetChart}>
        <svg
          width="58"
          height="34.03579715234098"
          viewBox="-29 -29 58 34.03579715234098"
          className={styles.cryptoWidgetSvg}
        >
          <path
            d="M -24 0 A 24 24 0 0 1 24 0"
            className={styles.cryptoWidgetTrack}
          />
          <path
            d={describeArc(clamped)}
            className={styles.cryptoWidgetValue}
            pathLength={100}
            strokeDasharray={`${clamped * 100} 100`}
          />
        </svg>
      </div>
      <div className={styles.cryptoWidgetCopy}>
        <p className={styles.cryptoWidgetValueText}>{renderPct(tokenId, clamped)}</p>
        <p className={styles.cryptoWidgetLabel}>{label}</p>
      </div>
    </div>
  );
}

function CardTitleHeader({
  imageSrc,
  title,
  subtitle,
  imageClassName,
  aside,
}: {
  imageSrc: string;
  title: string;
  subtitle?: React.ReactNode;
  imageClassName?: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className={styles.header}>
      <div className={styles.titleRow}>
        <CardThumb imageSrc={imageSrc} title={title} className={imageClassName} />
        <div className={styles.titleStack}>
          <h3 className={styles.title}>{title}</h3>
          {subtitle ? <div className={styles.titleSubline}>{subtitle}</div> : null}
        </div>
      </div>
      {aside ? <div className={styles.headerAside}>{aside}</div> : null}
    </div>
  );
}

function SmallAction({
  label,
  positive,
}: {
  label: string;
  positive: boolean;
}) {
  return (
    <span className={cn(styles.actionPill, positive ? styles.actionYes : styles.actionNo)}>
      {label}
    </span>
  );
}

function LargeAction({
  label,
  positive,
}: {
  label: string;
  positive: boolean;
}) {
  return (
    <span
      className={cn(styles.binaryActionPill, positive ? styles.actionYesLarge : styles.actionNoLarge)}
    >
      {label}
    </span>
  );
}

function SportsAction({
  label,
  tone,
}: {
  label: string;
  tone: "primary" | "secondary" | "success" | "danger";
}) {
  return (
    <span
      className={cn(
        styles.sportsActionPill,
        tone === "primary" && styles.sportsActionPrimary,
        tone === "secondary" && styles.sportsActionSecondary,
        tone === "success" && styles.sportsActionSuccess,
        tone === "danger" && styles.sportsActionDanger,
      )}
    >
      {label}
    </span>
  );
}

function HomeBinaryCardBody({ model }: { model: HomeBinaryCardModel }) {
  return (
    <>
      <CardTitleHeader
        imageSrc={model.imageSrc}
        title={model.title}
        subtitle={model.metaLabels.join(" · ")}
        imageClassName={styles.featuredThumb}
      />

      <div className={styles.binaryChanceRow}>
        <span className={styles.binaryChanceValue}>{renderPct(model.primaryTokenId, model.primaryPrice)}</span>
        <span className={styles.binaryChanceLabel}>chance</span>
        <span
          className={cn(
            styles.binaryChange,
            model.primaryChange > 0 && styles.binaryChangeUp,
            model.primaryChange < 0 && styles.binaryChangeDown,
          )}
        >
          {formatChanceDelta(model.primaryChange)}
        </span>
      </div>

      <div className={styles.binarySummary}>
        <span className={styles.volumeMeta}>{model.volumeLabel}</span>
      </div>

      <div className={styles.binaryActions}>
        {model.actions.map((action, index) => (
          <LargeAction
            key={`${action.label}:${index}`}
            label={action.label}
            positive={index === 0}
          />
        ))}
      </div>
    </>
  );
}

function HomeGroupedCardBody({ model }: { model: HomeGroupedCardModel }) {
  return (
    <>
      <CardTitleHeader imageSrc={model.imageSrc} title={model.title} />

      <div className={styles.rows}>
        {model.rows.map((row) => (
          <div key={row.id} className={styles.row}>
            <span className={styles.rowLabel}>{row.label}</span>
            <div className={styles.rowMeta}>
              <span className={styles.rowValue}>{renderPct(row.tokenId, row.price)}</span>
              <div className={styles.rowActions}>
                {row.actions.map((action, index) => (
                  <SmallAction
                    key={`${row.id}:${action.label}`}
                    label={action.label}
                    positive={index === 0}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.footerMeta}>
        <span className={styles.volumeMeta}>{model.volumeLabel}</span>
      </div>
    </>
  );
}

function HomeCryptoCardBody({
  model,
}: {
  model: Extract<HomeCardModel, { kind: "crypto-up-down" }>;
}) {
  const { headline, detail } = splitEventTitle(model.title);
  const cryptoHeadline = buildCryptoHeadline(headline, detail, model.assetLabel ?? undefined);

  return (
    <>
      <CardTitleHeader
        imageSrc={model.imageSrc}
        title={cryptoHeadline}
        imageClassName={styles.cryptoThumb}
        aside={<CryptoProbabilityWidget price={model.price} label="Up" tokenId={model.tokenId} />}
      />

      <div className={styles.cryptoSpacer} />

      <div className={styles.cryptoActions}>
        {model.actions.map((action, index) => (
          <LargeAction
            key={`${action.label}:${index}`}
            label={action.label}
            positive={index === 0}
          />
        ))}
      </div>

      <div className={styles.cryptoFooter}>
        <div className={styles.cryptoFooterMeta}>
          <span className={styles.cryptoLiveDot} aria-hidden="true" />
          <span className={styles.cryptoLiveLabel}>LIVE</span>
          <span className={styles.cryptoFooterDivider} aria-hidden="true">·</span>
          {model.assetLabel ? <span className={styles.cryptoFooterAsset}>{model.assetLabel}</span> : null}
        </div>
        <span className={styles.cryptoBookmark} aria-hidden="true">
          <Bookmark size={18} strokeWidth={2.1} />
        </span>
      </div>
    </>
  );
}

function HomeSportsLiveCardBody({ model }: { model: HomeSportsLiveCardModel }) {
  const isFinal = model.statusLabel === "Final";
  const statusSummary = [model.statusLabel, model.statusDetail].filter(Boolean).join(" ");
  const footerLead = isFinal ? null : (model.statusDetail ?? model.statusLabel);
  const leagueLabel = model.metaLabels[0] ?? "";
  const actionTones = isFinal
    ? (["success", "danger"] as const)
    : (["primary", "secondary"] as const);

  return (
    <>
      <div className={styles.sportsHeader}>
        {isFinal ? <span className={styles.sportsFinalHeader}>{statusSummary}</span> : null}
      </div>

      <div className={styles.sportsRows}>
        {model.competitors.map((competitor) => (
          <div
            key={competitor.key}
            className={cn(styles.sportsRow, isFinal && styles.sportsRowFinal)}
          >
            <div className={styles.sportsLeftRail}>
              {!isFinal ? <span className={styles.sportsBadge}>{competitor.shortName}</span> : null}
              <span className={cn(styles.sportsScore, isFinal && styles.sportsScoreFinal)}>
                {competitor.score ?? "--"}
              </span>
            </div>
            <div className={styles.sportsTeam}>
              <span className={cn(styles.sportsTeamName, isFinal && styles.sportsTeamNameFinal)}>
                {competitor.name}
              </span>
              {competitor.subtitle ? (
                <span className={styles.sportsTeamMeta}>{competitor.subtitle}</span>
              ) : null}
            </div>
            <span className={cn(styles.sportsPrice, isFinal && styles.sportsPriceFinal)}>
              {renderPct(competitor.tokenId, competitor.price)}
            </span>
          </div>
        ))}
      </div>

      <div className={cn(styles.sportsActions, isFinal && styles.sportsActionsFinal)}>
        {model.competitors.slice(0, 2).map((competitor, index) => (
          <SportsAction
            key={`${competitor.key}:action`}
            label={competitor.name}
            tone={actionTones[index]}
          />
        ))}
      </div>

      <div className={cn(styles.sportsFooter, isFinal && styles.sportsFooterFinal)}>
        <div className={cn(styles.sportsFooterMeta, isFinal && styles.sportsFooterMetaFinal)}>
          {!isFinal ? <span className={styles.sportsFooterLiveDot} aria-hidden="true" /> : null}
          {footerLead ? (
            <span className={cn(styles.sportsFooterStatus, !isFinal && styles.sportsFooterStatusLive)}>
              {footerLead}
            </span>
          ) : null}
          <span className={styles.sportsFooterText}>{model.volumeLabel}</span>
          {leagueLabel ? <span className={styles.sportsFooterText}>{leagueLabel}</span> : null}
        </div>
        <div className={styles.sportsFooterActions}>
          {!isFinal ? (
            <span className={styles.sportsFooterIcon} aria-hidden="true">
              <Gift size={18} strokeWidth={2.1} />
            </span>
          ) : null}
          <span className={styles.sportsFooterIcon} aria-hidden="true">
            <Bookmark size={18} strokeWidth={2.1} />
          </span>
        </div>
      </div>
    </>
  );
}

export function HomeMarketCard({
  model,
  emphasis,
  layoutVariant,
}: HomeMarketCardProps) {
  const sharedFrameProps = {
    emphasis,
    layoutVariant,
  };

  switch (model.kind) {
    case "binary":
      return (
        <CardLink href={model.href} kind={model.kind} {...sharedFrameProps}>
          <HomeBinaryCardBody model={model} />
        </CardLink>
      );
    case "grouped":
      return (
        <CardLink href={model.href} kind={model.kind} {...sharedFrameProps}>
          <HomeGroupedCardBody model={model} />
        </CardLink>
      );
    case "crypto-up-down":
      return (
        <CardLink href={model.href} kind={model.kind} {...sharedFrameProps}>
          <HomeCryptoCardBody model={model} />
        </CardLink>
      );
    case "sports-live":
      return (
        <CardLink href={model.href} kind={model.kind} {...sharedFrameProps}>
          <HomeSportsLiveCardBody model={model} />
        </CardLink>
      );
  }
}
