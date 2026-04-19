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
}: PriceCellProps) {
  const {
    tick: { price },
    flash: { seq, dir },
  } = useRetainedLivePrice(tokenId);
  const formatter = format ?? FORMATTERS[formatKind];

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
      {formatter(price)}
    </span>
  );
}

PriceCellInner.displayName = "PriceCell";

export const PriceCell = memo(PriceCellInner);
