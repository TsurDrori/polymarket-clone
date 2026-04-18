import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";
import styles from "./Skeleton.module.css";

type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(styles.skeleton, className)}
      {...props}
    />
  );
}
