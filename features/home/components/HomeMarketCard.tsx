"use client";

import { Bookmark } from "lucide-react";
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
  const startX = 29 + radius * Math.cos(startAngle);
  const startY = 29 + radius * Math.sin(startAngle);
  const endX = 29 + radius * Math.cos(endAngle);
  const endY = 29 + radius * Math.sin(endAngle);
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
      <svg viewBox="0 0 58 38" className={styles.cryptoWidgetSvg}>
        <path
          d="M 5 29 A 24 24 0 0 1 53 29"
          className={styles.cryptoWidgetTrack}
        />
        <path
          d={describeArc(clamped)}
          className={styles.cryptoWidgetValue}
          pathLength={100}
          strokeDasharray={`${clamped * 100} 100`}
        />
      </svg>
      <div className={styles.cryptoWidgetCopy}>
        <span className={styles.cryptoWidgetValueText}>{renderPct(tokenId, clamped)}</span>
        <span className={styles.cryptoWidgetLabel}>{label}</span>
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
  return (
    <>
      <div className={styles.sportsStatusRow}>
        <span className={styles.sportsStatus}>{model.statusLabel}</span>
        {model.statusDetail ? <span className={styles.sportsDetail}>{model.statusDetail}</span> : null}
      </div>

      <div className={styles.sportsRows}>
        {model.competitors.map((competitor) => (
          <div key={competitor.key} className={styles.sportsRow}>
            <span className={styles.sportsScore}>{competitor.score ?? "--"}</span>
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
          <LargeAction
            key={`${competitor.key}:action`}
            label={competitor.name}
            positive={index === 0}
          />
        ))}
      </div>

      <div className={styles.footerMeta}>
        <span className={styles.volumeMeta}>
          {model.volumeLabel}
          {model.metaLabels[0] ? ` · ${model.metaLabels[0]}` : ""}
        </span>
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
