import type { ButtonHTMLAttributes, Ref } from "react";
import { cn } from "@/shared/lib/cn";
import styles from "./Button.module.css";

type ButtonVariant = "yes" | "no" | "blue" | "yellow";
type ButtonSize = "sm" | "md";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: ButtonVariant;
  size?: ButtonSize;
  ref?: Ref<HTMLButtonElement>;
};

export function Button({
  variant,
  size = "md",
  className,
  type = "button",
  ref,
  ...props
}: ButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      data-variant={variant}
      data-size={size}
      className={cn(styles.button, className)}
      {...props}
    />
  );
}
