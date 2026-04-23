import Image from "next/image";
import { ProbabilityArc } from "./ProbabilityArc";
import { BinarySingleCardFrame } from "./BinarySingleCardFrame";
import { OutcomeActionContent } from "./OutcomeActionContent";
import {
  SingleBinaryInfoLine,
  type SingleBinaryInfoItem,
} from "./SingleBinaryInfoLine";
import { cn } from "@/shared/lib/cn";
import { shouldBypassNextImageOptimization } from "@/shared/lib/images";
import { isYesNoOutcomeLabel } from "@/shared/lib/outcomes";
import styles from "./BinaryWidgetCard.module.css";

type BinaryWidgetCardProps = {
  title: string;
  href: string;
  imageSrc: string | null;
  probability: {
    price: number;
    tokenId?: string;
    label: string;
    size?: "sm" | "md";
  };
  actions: [
    {
      label: string;
      tone: "yes" | "no";
      tokenId?: string;
      fallbackPrice?: number;
    },
    {
      label: string;
      tone: "yes" | "no";
      tokenId?: string;
      fallbackPrice?: number;
    },
  ];
  subtitle?: string | null;
  summaryLeading?: string;
  summaryTrailing?: string;
  summaryTrailingTone?: "up" | "down" | "default";
  showLiveDot?: boolean;
  liveLabel?: string;
  footerVolume?: string;
  footerTrailing?: string;
  emphasis?: {
    isLiveLeader?: boolean;
    isPromoted?: boolean;
  };
};

export function BinaryWidgetCard({
  title,
  href,
  imageSrc,
  probability,
  actions,
  subtitle,
  summaryLeading,
  summaryTrailing,
  summaryTrailingTone = "default",
  showLiveDot = false,
  liveLabel = "LIVE",
  footerVolume,
  footerTrailing,
  emphasis,
}: BinaryWidgetCardProps) {
  const footerItems: SingleBinaryInfoItem[] = [];

  if (showLiveDot) {
    footerItems.push({ kind: "live-dot" });
    footerItems.push({ kind: "text", text: liveLabel, tone: "live" });
  }

  const footerLeadingText = footerVolume ?? summaryLeading;
  if (footerLeadingText) {
    if (footerItems.length > 0) {
      footerItems.push({ kind: "divider" });
    }
    footerItems.push({ kind: "text", text: footerLeadingText });
  }

  if (footerTrailing) {
    if (footerItems.length > 0) {
      footerItems.push({ kind: "divider" });
    }
    footerItems.push({ kind: "text", text: footerTrailing });
  }

  return (
    <BinarySingleCardFrame
      href={href}
      cardClassName={styles.card}
      primarySpansSecondary
      emphasis={emphasis}
      primarySlot={
        <header className={styles.header}>
          <div className={styles.titleRow}>
            <div className={styles.iconWrap}>
              {imageSrc ? (
                <Image
                  src={imageSrc}
                  alt=""
                  fill
                  sizes="48px"
                  unoptimized={shouldBypassNextImageOptimization(imageSrc)}
                  className={styles.icon}
                />
              ) : (
                <span className={styles.iconFallback}>{title.slice(0, 1)}</span>
              )}
            </div>
            <div className={styles.titleStack}>
              <h2 className={styles.title}>{title}</h2>
              {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
            </div>
          </div>
          <div className={styles.headerAside}>
            <ProbabilityArc
              price={probability.price}
              tokenId={probability.tokenId}
              label={probability.label}
              size={probability.size}
            />
          </div>
        </header>
      }
      actionsSlot={
        <div className={styles.actions}>
          {actions.map((action, index) => (
            <span
              key={`${action.label}:${index}`}
              className={cn(styles.action, action.tone === "yes" ? styles.actionYes : styles.actionNo)}
            >
              <OutcomeActionContent
                label={action.label}
                tokenId={action.tokenId}
                fallbackPrice={action.fallbackPrice}
                showPriceOnHover={isYesNoOutcomeLabel(action.label)}
              />
            </span>
          ))}
        </div>
      }
      footerSlot={
        <SingleBinaryInfoLine
          items={footerItems}
          trailingText={summaryTrailing}
          trailingTextTone={summaryTrailingTone}
        />
      }
    />
  );
}
