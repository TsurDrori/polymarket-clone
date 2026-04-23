"use client";

import { Bookmark, Gift } from "lucide-react";
import Image from "next/image";
import { PriceCell } from "@/features/events/components/PriceCell";
import { BinaryGroupCard } from "@/features/market-cards/components/BinaryGroupCard";
import { BinarySingleCardFrame } from "@/features/market-cards/components/BinarySingleCardFrame";
import { BinaryWidgetCard } from "@/features/market-cards/components/BinaryWidgetCard";
import { SingleBinaryInfoLine } from "@/features/market-cards/components/SingleBinaryInfoLine";
import { cn } from "@/shared/lib/cn";
import { formatPct } from "@/shared/lib/format";
import { shouldBypassNextImageOptimization } from "@/shared/lib/images";
import type { SurfaceFeedLayoutVariant } from "@/features/events/feed/types";
import type {
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

const firstWord = (value: string) => value.trim().split(/\s+/)[0] ?? value;

const CRYPTO_ASSET_SYMBOLS: Record<string, string> = {
  Bitcoin: "BTC",
  Ethereum: "ETH",
  Solana: "SOL",
  Dogecoin: "DOGE",
  BNB: "BNB",
  XRP: "XRP",
  Microstrategy: "MSTR",
};

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

function SportsAction({
  label,
  tone,
}: {
  label: string;
  tone: "primary" | "secondary";
}) {
  return (
    <span
      className={cn(
        styles.sportsActionPill,
        tone === "primary" && styles.sportsActionPrimary,
        tone === "secondary" && styles.sportsActionSecondary,
      )}
    >
      {label}
    </span>
  );
}

function HomeGroupedCardBody({ model }: { model: HomeGroupedCardModel }) {
  return (
    <BinaryGroupCard
      title={model.title}
      href={model.href}
      imageSrc={model.imageSrc}
      rows={model.rows.map((row) => ({
        id: row.id,
        label: row.label,
        probabilityTokenId: row.tokenId,
        probabilityFallback: row.price,
        actions: [
          { label: row.actions[0].label, tone: "yes" as const },
          { label: row.actions[1].label, tone: "no" as const },
        ],
      }))}
      volumeLabel={model.volumeLabel}
    />
  );
}

function buildHomeCryptoWidgetModel(
  model: Extract<HomeCardModel, { kind: "crypto-up-down" }>,
) {
  const { headline, detail } = splitEventTitle(model.title);
  const cryptoHeadline = buildCryptoHeadline(headline, detail, model.assetLabel ?? undefined);
  return {
    title: cryptoHeadline,
    probability: {
      price: model.price,
      tokenId: model.tokenId,
      label: "Up",
      size: "sm" as const,
    },
    actions: [
      { label: model.actions[0].label, tone: "yes" as const },
      { label: model.actions[1].label, tone: "no" as const },
    ] as const,
    showLiveDot: true,
    liveLabel: "LIVE",
    footerTrailing: model.assetLabel ?? undefined,
  };
}

function HomeSportsLiveCardBody({
  model,
  emphasis,
}: {
  model: HomeSportsLiveCardModel;
  emphasis?: HomeMarketCardProps["emphasis"];
}) {
  const leagueLabel = model.metaLabels[0] ?? "";
  const isLive = model.statusLabel === "Live";
  const compactStatusDetail =
    model.statusLabel === "Final" && model.statusDetail?.match(/^\d+\s*[-:]\s*\d+$/)
      ? null
      : model.statusDetail;
  const statusLead = isLive ? compactStatusDetail : model.statusLabel;

  const rows = model.competitors.slice(0, 2).map((competitor) => (
    <div key={competitor.key} className={styles.sportsMatchupRow}>
      <div className={styles.sportsMatchupIdentity}>
        <div className={styles.sportsMatchupLogoWrap}>
          {competitor.logo ? (
            <Image
              src={competitor.logo}
              alt=""
              fill
              sizes="32px"
              unoptimized={shouldBypassNextImageOptimization(competitor.logo)}
              className={styles.sportsMatchupLogo}
            />
          ) : (
            <span className={styles.sportsMatchupFallback}>{competitor.shortName}</span>
          )}
        </div>
        {competitor.score ? <span className={styles.sportsMatchupScore}>{competitor.score}</span> : null}
        {competitor.score ? (
          <span className={styles.sportsMatchupDivider} aria-hidden="true">
            |
          </span>
        ) : null}
        <span className={styles.sportsMatchupName}>{competitor.name}</span>
      </div>
      <span className={styles.sportsMatchupPrice}>
        {renderPct(competitor.tokenId, competitor.price)}
      </span>
    </div>
  ));

  return (
    <BinarySingleCardFrame
      href={model.href}
      emphasis={emphasis}
      primarySlot={rows[0]}
      secondarySlot={rows[1] ?? null}
      actionsSlot={
        <div className={styles.sportsActions}>
          {model.competitors.slice(0, 2).map((competitor, index) => (
            <SportsAction
              key={`${competitor.key}:action`}
              label={firstWord(competitor.name)}
              tone={index === 0 ? "primary" : "secondary"}
            />
          ))}
        </div>
      }
      footerSlot={
        <SingleBinaryInfoLine
          items={[
            ...(isLive ? ([{ kind: "live-dot" as const }] as const) : []),
            ...(statusLead
              ? ([{ kind: "text" as const, text: statusLead }] as const)
              : []),
            ...(statusLead
              ? ([{ kind: "divider" as const }] as const)
              : []),
            { kind: "text" as const, text: model.volumeLabel },
            ...(leagueLabel
              ? ([{ kind: "divider" as const }, { kind: "text" as const, text: leagueLabel }] as const)
              : []),
          ]}
          trailingActions={
            <>
              <span className={styles.sportsFooterIcon} aria-hidden="true">
                <Gift size={18} strokeWidth={2.1} />
              </span>
              <span className={styles.sportsFooterIcon} aria-hidden="true">
                <Bookmark size={18} strokeWidth={2.1} />
              </span>
            </>
          }
        />
      }
    />
  );
}

export function HomeMarketCard({
  model,
  emphasis,
  layoutVariant,
}: HomeMarketCardProps) {
  void layoutVariant;

  switch (model.kind) {
    case "binary":
      return (
        <BinaryWidgetCard
          title={model.title}
          href={model.href}
          imageSrc={model.imageSrc}
          probability={{
            price: model.primaryPrice,
            tokenId: model.primaryTokenId,
            label: "chance",
          }}
          actions={[
            { label: model.actions[0].label, tone: "yes" },
            { label: model.actions[1].label, tone: "no" },
          ]}
          summaryLeading={model.volumeLabel}
          summaryTrailing={formatChanceDelta(model.primaryChange)}
          summaryTrailingTone={
            model.primaryChange > 0 ? "up" : model.primaryChange < 0 ? "down" : "default"
          }
          emphasis={emphasis}
        />
      );
    case "grouped":
      return <HomeGroupedCardBody model={model} />;
    case "crypto-up-down": {
      const cryptoWidget = buildHomeCryptoWidgetModel(model);
      return (
        <BinaryWidgetCard
          title={cryptoWidget.title}
          href={model.href}
          imageSrc={model.imageSrc}
          probability={cryptoWidget.probability}
          actions={cryptoWidget.actions as [{ label: string; tone: "yes" | "no" }, { label: string; tone: "yes" | "no" }]}
          showLiveDot={cryptoWidget.showLiveDot}
          liveLabel={cryptoWidget.liveLabel}
          footerTrailing={cryptoWidget.footerTrailing}
          emphasis={emphasis}
        />
      );
    }
    case "sports-live":
      return <HomeSportsLiveCardBody model={model} emphasis={emphasis} />;
  }
}
