import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  Ref,
} from "react";
import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import styles from "./Tab.module.css";

type TabLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  ref?: Ref<HTMLAnchorElement>;
};

type TabButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: undefined;
  ref?: Ref<HTMLButtonElement>;
};

type TabProps = TabLinkProps | TabButtonProps;

export function Tab(props: TabProps) {
  if (props.href !== undefined) {
    const { href, className, ref, role, ...rest } = props;
    return (
      <Link
        href={href}
        ref={ref}
        role={role}
        className={cn(styles.tab, className)}
        {...rest}
      />
    );
  }
  const {
    className,
    ref,
    type = "button",
    role = "tab",
    ...rest
  } = props;
  return (
    <button
      ref={ref}
      type={type}
      role={role}
      className={cn(styles.tab, className)}
      {...rest}
    />
  );
}
