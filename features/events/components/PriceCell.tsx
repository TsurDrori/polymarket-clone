"use client";

import { memo } from "react";
import { useRetainedLivePrice } from "@/features/realtime/hooks";
import { cn } from "@/shared/lib/cn";
import { formatCents, formatPct, formatSportsPct } from "@/shared/lib/format";
import styles from "./PriceCell.module.css";

type PriceCellFormatter = (price: number) => string;

type PriceCellProps = {
  tokenId: string;
  className?: string;
  fallbackValue?: number;
} & (
  | {
      format: PriceCellFormatter;
      formatKind?: never;
    }
  | {
      format?: never;
      formatKind: "cents" | "pct" | "sportsPct";
    }
);

const FORMATTERS: Record<"cents" | "pct" | "sportsPct", PriceCellFormatter> = {
  cents: formatCents,
  pct: formatPct,
  sportsPct: formatSportsPct,
};

function PriceCellInner({
  tokenId,
  format,
  formatKind,
  className,
  fallbackValue,
}: PriceCellProps) {
  const {
    tick,
    flash: { seq, dir },
  } = useRetainedLivePrice(tokenId);
  const formatter = format ?? FORMATTERS[formatKind];
  const resolvedPrice =
    fallbackValue !== undefined && tick.ts <= 0 ? fallbackValue : tick.price;

  return (
    <span
      key={seq}
      className={cn(
        styles.price,
        dir === "up" && styles.flashUp,
        dir === "down" && styles.flashDown,
        className,
      )}
    >
      {formatter(resolvedPrice)}
    </span>
  );
}

PriceCellInner.displayName = "PriceCell";

export const PriceCell = memo(PriceCellInner);
