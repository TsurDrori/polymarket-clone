"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { isTabActive } from "../activeTab";
import { MOBILE_BOTTOM_ITEMS } from "./navItems";
import styles from "./MobileBottomNav.module.css";

type MobileBottomNavProps = {
  onSearch: () => void;
  onMore: () => void;
};

export function MobileBottomNav({
  onSearch,
  onMore,
}: MobileBottomNavProps) {
  const pathname = usePathname() ?? "/";

  return (
    <nav className={styles.nav} aria-label="Mobile quick actions">
      {MOBILE_BOTTOM_ITEMS.map((item) => {
        const Icon = item.icon;
        const href = "href" in item ? item.href : undefined;
        const activeHref =
          "activeMatch" in item ? item.activeMatch : href ?? "/";
        const active = href ? isTabActive(pathname, activeHref) : false;

        if (!href) {
          return (
            <button
              key={item.label}
              type="button"
              className={styles.item}
              onClick={onSearch}
            >
              <Icon className={styles.icon} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        }

        return (
          <Link
            key={item.label}
            href={href}
            className={styles.item}
            aria-current={active ? "page" : undefined}
          >
            <Icon className={styles.icon} aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}

      <button type="button" className={styles.item} onClick={onMore}>
        <Menu className={styles.icon} aria-hidden="true" />
        <span>More</span>
      </button>
    </nav>
  );
}
