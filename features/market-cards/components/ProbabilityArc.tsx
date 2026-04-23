"use client";

import type { CSSProperties } from "react";
import { useRetainedLivePrice } from "@/features/realtime/hooks";
import { PriceCell } from "@/features/events/components/PriceCell";
import { formatPct } from "@/shared/lib/format";
import { clampProbability, getProbabilityColor } from "@/shared/lib/probabilityColor";
import styles from "./ProbabilityArc.module.css";

const describeArc = (value: number): string => {
  const radius = 24;
  const clamped = clampProbability(value);
  const startAngle = Math.PI;
  const endAngle = Math.PI * (1 - clamped);
  const startX = radius * Math.cos(startAngle);
  const startY = radius * Math.sin(startAngle);
  const endX = radius * Math.cos(endAngle);
  const endY = radius * Math.sin(endAngle);
  const largeArcFlag = clamped > 0.5 ? 1 : 0;

  return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
};

type ProbabilityArcProps = {
  price: number;
  label: string;
  tokenId?: string | null;
  color?: string;
  size?: "sm" | "md";
};

export function ProbabilityArc({
  price,
  label,
  tokenId,
  color,
  size = "md",
}: ProbabilityArcProps) {
  const { tick } = useRetainedLivePrice(tokenId ?? "");
  const livePrice =
    tokenId && tick.ts > 0 ? tick.price : price;
  const clamped = clampProbability(livePrice);
  const resolvedColor = color ?? getProbabilityColor(clamped);
  const width = size === "sm" ? 58 : 64;
  const height = size === "sm" ? 34.03579715234098 : 38;

  return (
    <div
      className={styles.root}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={clamped}
      style={
        {
          "--arc-width": `${width}px`,
          "--arc-height": `${height}px`,
          "--arc-copy-offset": size === "sm" ? "-26px" : "-29px",
          "--arc-color": resolvedColor,
          "--arc-value-color": resolvedColor,
        } as CSSProperties
      }
    >
      <div className={styles.chart}>
        <svg
          width={width}
          height={height}
          viewBox="-29 -29 58 34.03579715234098"
          className={styles.svg}
        >
          <path d="M -24 0 A 24 24 0 0 1 24 0" className={styles.track} />
          <path
            d={describeArc(clamped)}
            className={styles.value}
            pathLength={100}
            strokeDasharray={`${clamped * 100} 100`}
          />
        </svg>
      </div>
      <div className={styles.copy}>
        <p className={styles.valueText}>
          {tokenId ? (
            <PriceCell tokenId={tokenId} formatKind="pct" fallbackValue={clamped} />
          ) : (
            formatPct(clamped)
          )}
        </p>
        <p className={styles.label}>{label}</p>
      </div>
    </div>
  );
}
