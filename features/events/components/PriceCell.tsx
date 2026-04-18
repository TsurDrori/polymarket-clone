"use client";

import { memo, useEffect } from "react";
import {
  releaseTokenAtoms,
  retainTokenAtoms,
} from "@/features/realtime/atoms";
import { useFlash, useLivePrice } from "@/features/realtime/hooks";
import { cn } from "@/shared/lib/cn";
import styles from "./PriceCell.module.css";

type PriceCellProps = {
  tokenId: string;
  format: (price: number) => string;
  className?: string;
};

function PriceCellInner({ tokenId, format, className }: PriceCellProps) {
  const { price } = useLivePrice(tokenId);
  const { seq, dir } = useFlash(tokenId);

  useEffect(() => {
    retainTokenAtoms(tokenId);

    return () => {
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
      {format(price)}
    </span>
  );
}

PriceCellInner.displayName = "PriceCell";

export const PriceCell = memo(PriceCellInner);
