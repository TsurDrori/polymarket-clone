"use client";

import { Bookmark, Gift } from "lucide-react";
import Image from "next/image";
import { PriceCell } from "@/features/events/components/PriceCell";
import { BinaryGroupCard } from "@/features/market-cards/components/BinaryGroupCard";
import { BinarySingleCardFrame } from "@/features/market-cards/components/BinarySingleCardFrame";
import { BinaryWidgetCard } from "@/features/market-cards/components/BinaryWidgetCard";
import { LivePriceDelta } from "@/features/market-cards/components/LivePriceDelta";
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

const getCompactSportsActionLabel = (competitor: HomeSportsLiveCardModel["competitors"][number]) => {
  const shortLabel = competitor.shortName.trim();
  if (shortLabel.length > 0 && (shortLabel.length <= 10 || !shortLabel.includes(" "))) {
    return shortLabel;
  }

  return firstWord(competitor.name);
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
  if (!assetLabel) {
    return headline;
  }

  const normalizedHeadline = headline.trim().toLowerCase();
  const normalizedAssetLabel = assetLabel.trim().toLowerCase();
  const assetAliases = new Set([normalizedAssetLabel]);

  if (normalizedAssetLabel === "bitcoin") {
    assetAliases.add("btc");
  }

  const isUpDownHeadline = Array.from(assetAliases).some(
    (alias) =>
      normalizedHeadline === `${alias} up or down` ||
      normalizedHeadline.endsWith(` ${alias} up or down`) ||
      normalizedHeadline.startsWith(`${alias} `),
  );

  if (!isUpDownHeadline) {
    return headline;
  }

  const intervalMinutes = parseIntervalMinutes(detail);
  if (!intervalMinutes) {
    return headline.replace(/^\s*btc\b/i, assetLabel);
  }

  const minuteLabel = intervalMinutes === 1 ? "Minute" : "Minutes";
  return `${assetLabel} ${intervalMinutes} ${minuteLabel} Up or Down`;
};

function SportsAction({
  label,
  colorFamily,
}: {
  label: string;
  colorFamily: SportsActionColorFamily;
}) {
  return (
    <span className={styles.sportsActionPill} data-color={colorFamily}>
      {label}
    </span>
  );
}

const SPORTS_ACTION_COLOR_FAMILIES = [
  "blue",
  "yellow",
  "green",
  "red",
  "purple",
  "teal",
] as const;

type SportsActionColorFamily = (typeof SPORTS_ACTION_COLOR_FAMILIES)[number];

const hashString = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const getSportsActionColorFamily = (
  seed: string,
  taken: Set<SportsActionColorFamily>,
): SportsActionColorFamily => {
  const startIndex = hashString(seed) % SPORTS_ACTION_COLOR_FAMILIES.length;

  for (let offset = 0; offset < SPORTS_ACTION_COLOR_FAMILIES.length; offset += 1) {
    const family =
      SPORTS_ACTION_COLOR_FAMILIES[(startIndex + offset) % SPORTS_ACTION_COLOR_FAMILIES.length]!;

    if (!taken.has(family)) {
      taken.add(family);
      return family;
    }
  }

  return SPORTS_ACTION_COLOR_FAMILIES[startIndex]!;
};

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
          {
            label: row.actions[0].label,
            tone: "yes" as const,
            tokenId: row.actions[0].tokenId,
            fallbackPrice: row.actions[0].price,
          },
          {
            label: row.actions[1].label,
            tone: "no" as const,
            tokenId: row.actions[1].tokenId,
            fallbackPrice: row.actions[1].price,
          },
        ],
      }))}
      volumeLabel={model.volumeLabel}
      overlayNode={
        model.primaryTokenId ? <LivePriceDelta tokenId={model.primaryTokenId} /> : undefined
      }
    />
  );
}

function buildHomeCryptoWidgetModel(
  model: Extract<HomeCardModel, { kind: "crypto-up-down" }>,
) {
  const { headline, detail } = splitEventTitle(model.title);
  const cryptoHeadline = buildCryptoHeadline(headline, detail, model.assetLabel ?? undefined);
  const actions: [
    {
      label: string;
      tone: "yes";
      tokenId?: string;
      fallbackPrice: number;
    },
    {
      label: string;
      tone: "no";
      tokenId?: string;
      fallbackPrice: number;
    },
  ] = [
    {
      label: model.actions[0].label,
      tone: "yes",
      tokenId: model.actions[0].tokenId,
      fallbackPrice: model.actions[0].price,
    },
    {
      label: model.actions[1].label,
      tone: "no",
      tokenId: model.actions[1].tokenId,
      fallbackPrice: model.actions[1].price,
    },
  ];

  return {
    title: cryptoHeadline,
    probability: {
      price: model.price,
      tokenId: model.tokenId,
      label: "Up",
      size: "sm" as const,
    },
    actions,
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
  const usedActionFamilies = new Set<SportsActionColorFamily>();
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
              label={getCompactSportsActionLabel(competitor)}
              colorFamily={getSportsActionColorFamily(
                `${competitor.shortName}:${competitor.name}:${index}`,
                usedActionFamilies,
              )}
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
            {
              label: model.actions[0].label,
              tone: "yes",
              tokenId: model.actions[0].tokenId,
              fallbackPrice: model.actions[0].price,
            },
            {
              label: model.actions[1].label,
              tone: "no",
              tokenId: model.actions[1].tokenId,
              fallbackPrice: model.actions[1].price,
            },
          ]}
          summaryLeading={model.volumeLabel}
          overlayNode={
            model.primaryTokenId ? <LivePriceDelta tokenId={model.primaryTokenId} /> : undefined
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
          actions={cryptoWidget.actions}
          showLiveDot={cryptoWidget.showLiveDot}
          liveLabel={cryptoWidget.liveLabel}
          footerTrailing={cryptoWidget.footerTrailing}
          overlayNode={
            model.tokenId ? <LivePriceDelta tokenId={model.tokenId} /> : undefined
          }
          emphasis={emphasis}
        />
      );
    }
    case "sports-live":
      return <HomeSportsLiveCardBody model={model} emphasis={emphasis} />;
  }
}
