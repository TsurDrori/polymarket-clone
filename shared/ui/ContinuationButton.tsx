import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";
import styles from "./ContinuationButton.module.css";

type ContinuationButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function ContinuationButton({
  className,
  type = "button",
  ...props
}: ContinuationButtonProps) {
  return (
    <button
      type={type}
      className={cn(styles.button, className)}
      {...props}
    />
  );
}
