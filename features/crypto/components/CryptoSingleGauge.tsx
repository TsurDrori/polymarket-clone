"use client";

import type { CSSProperties } from "react";
import { useRetainedLivePrice } from "@/features/realtime/hooks";
import { cn } from "@/shared/lib/cn";
import { formatPct } from "@/shared/lib/format";
import styles from "./CryptoCard.module.css";

type CryptoSingleGaugeProps = {
  label: string;
  fallbackPrice: number;
  tokenId: string | null;
};

const clampPrice = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
};

type GaugeFrameProps = {
  label: string;
  price: number;
  flashDirection?: "up" | "down" | null;
  flashSeq?: number;
};

function GaugeFrame({
  label,
  price,
  flashDirection = null,
  flashSeq = 0,
}: GaugeFrameProps) {
  const safePrice = clampPrice(price);
  const gaugeStyle = {
    "--crypto-card-progress": `${Math.round(safePrice * 100)}%`,
  } as CSSProperties;

  return (
    <div
      className={styles.gauge}
      style={gaugeStyle}
      role="progressbar"
      aria-label={`${label} probability`}
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={safePrice}
      aria-valuetext={formatPct(safePrice)}
    >
      <strong
        key={flashSeq}
        className={cn(
          styles.gaugeValue,
          flashDirection === "up" && styles.flashUp,
          flashDirection === "down" && styles.flashDown,
        )}
      >
        {formatPct(safePrice)}
      </strong>
      <span className={styles.gaugeLabel}>{label}</span>
    </div>
  );
}

function LiveGauge({
  label,
  fallbackPrice,
  tokenId,
}: CryptoSingleGaugeProps & {
  tokenId: string;
}) {
  const {
    tick,
    flash,
  } = useRetainedLivePrice(tokenId);
  const price = tick.ts > 0 ? tick.price : fallbackPrice;

  return (
    <GaugeFrame
      label={label}
      price={price}
      flashDirection={flash.dir}
      flashSeq={flash.seq}
    />
  );
}

export function CryptoSingleGauge({
  label,
  fallbackPrice,
  tokenId,
}: CryptoSingleGaugeProps) {
  if (!tokenId) {
    return <GaugeFrame label={label} price={fallbackPrice} />;
  }

  return (
    <LiveGauge
      label={label}
      fallbackPrice={fallbackPrice}
      tokenId={tokenId}
    />
  );
}
