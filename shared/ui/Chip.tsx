import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";
import styles from "./Chip.module.css";

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export function Chip({
  active = false,
  className,
  type = "button",
  ...props
}: ChipProps) {
  return (
    <button
      type={type}
      data-active={active}
      className={cn(styles.chip, className)}
      {...props}
    />
  );
}
