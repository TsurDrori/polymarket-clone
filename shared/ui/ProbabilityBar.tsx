import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";
import styles from "./ProbabilityBar.module.css";

type ProbabilityBarProps = HTMLAttributes<HTMLDivElement> & {
  price: number;
};

export function ProbabilityBar({
  price,
  className,
  ...props
}: ProbabilityBarProps) {
  const p = Math.max(0, Math.min(1, price ?? 0));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={p}
      className={cn(styles.track, className)}
      {...props}
    >
      <div className={styles.fill} style={{ width: `${p * 100}%` }} />
    </div>
  );
}
