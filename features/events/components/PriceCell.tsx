"use client";

import { memo, useEffect } from "react";
import {
  releaseTokenAtoms,
  retainTokenAtoms,
} from "@/features/realtime/atoms";
import { useFlash, useLivePrice } from "@/features/realtime/hooks";
import { subscribe, unsubscribe } from "@/features/realtime/subscriptions";
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
  const { price } = useLivePrice(tokenId);
  const { seq, dir } = useFlash(tokenId);
  const formatter = format ?? FORMATTERS[formatKind];

  useEffect(() => {
    retainTokenAtoms(tokenId);
    subscribe([tokenId]);

    return () => {
      unsubscribe([tokenId]);
      releaseTokenAtoms(tokenId);
    };
  }, [tokenId]);

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
