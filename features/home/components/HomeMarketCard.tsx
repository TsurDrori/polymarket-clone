"use client";

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

const describeArc = (value: number): string => {
  const radius = 29;
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

function MarketArcGauge({
  price,
  label,
  positive,
}: {
  price: number;
  label: string;
  positive: boolean;
}) {
  const clamped = Math.max(0, Math.min(1, price));

  return (
    <div className={styles.arcGauge} aria-hidden="true">
      <svg viewBox="0 0 58 34" className={styles.arcSvg}>
        <path
          d="M 0 29 A 29 29 0 0 1 58 29"
          className={styles.arcTrack}
          pathLength={100}
        />
        <path
          d={describeArc(clamped)}
          className={positive ? styles.arcValueUp : styles.arcValueDown}
          pathLength={100}
          strokeDasharray={`${clamped * 100} 100`}
        />
      </svg>
      <div className={styles.arcGaugeCopy}>
        <span className={styles.arcGaugeValue}>{formatPct(clamped)}</span>
        <span className={styles.arcGaugeLabel}>{label}</span>
      </div>
    </div>
  );
}

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

function CardThumb({ imageSrc, title }: { imageSrc: string; title: string }) {
  return (
    <div className={styles.mediaWrap}>
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

function CardTitleHeader({
  imageSrc,
  title,
  aside,
}: {
  imageSrc: string;
  title: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className={styles.header}>
      <div className={styles.titleRow}>
        <CardThumb imageSrc={imageSrc} title={title} />
        <div className={styles.titleStack}>
          <h3 className={styles.title}>{title}</h3>
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
        aside={<MarketArcGauge price={model.primaryPrice} label="chance" positive={false} />}
      />

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
  const meta = [model.liveLabel, model.assetLabel].filter(Boolean).join(" · ");

  return (
    <>
      <CardTitleHeader
        imageSrc={model.imageSrc}
        title={model.title}
        aside={<MarketArcGauge price={model.price} label="Up" positive />}
      />

      <div className={styles.cryptoMeta}>
        <span className={styles.volumeMeta}>{model.volumeLabel}</span>
        {meta ? <span className={styles.cryptoLabel}>{meta}</span> : null}
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
