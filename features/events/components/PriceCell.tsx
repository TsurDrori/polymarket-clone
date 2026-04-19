"use client";

import { memo } from "react";
import { useRetainedLivePrice } from "@/features/realtime/hooks";
import { cn } from "@/shared/lib/cn";
import { formatCents, formatPct } from "@/shared/lib/format";
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
      formatKind: "cents" | "pct";
    }
);

const FORMATTERS: Record<"cents" | "pct", PriceCellFormatter> = {
  cents: formatCents,
  pct: formatPct,
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
