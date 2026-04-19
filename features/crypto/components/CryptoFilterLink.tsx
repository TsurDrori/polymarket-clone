"use client";

import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";

type CryptoFilterLinkProps = {
  active?: boolean;
  href: string;
  onNavigate?: () => void;
  children: ReactNode;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "href" | "onClick">;

const isUnmodifiedPrimaryClick = (event: MouseEvent<HTMLAnchorElement>): boolean =>
  event.button === 0 &&
  !event.altKey &&
  !event.ctrlKey &&
  !event.metaKey &&
  !event.shiftKey &&
  event.currentTarget.target !== "_blank" &&
  !event.currentTarget.hasAttribute("download");

export function CryptoFilterLink({
  active = false,
  href,
  onNavigate,
  children,
  ...props
}: CryptoFilterLinkProps) {
  return (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        if (!onNavigate || !isUnmodifiedPrimaryClick(event)) {
          return;
        }

        event.preventDefault();

        if (active) {
          return;
        }

        onNavigate();
      }}
    >
      {children}
    </a>
  );
}
