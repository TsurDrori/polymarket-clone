"use client";

import { usePathname } from "next/navigation";
import { Tab } from "@/shared/ui/Tab";
import { isTabActive } from "../activeTab";
import { HEADER_MARKET_ITEMS } from "./navItems";
import styles from "./CategoryNav.module.css";

export function CategoryNav() {
  const pathname = usePathname() ?? "/";
  return (
    <nav aria-label="Browse markets" className={styles.nav}>
      {HEADER_MARKET_ITEMS.map((item) => {
        const activeHref = item.activeMatch ?? item.href ?? "/";
        const active = isTabActive(pathname, activeHref);
        return (
          <Tab
            key={item.label}
            href={item.href ?? "#"}
            aria-current={active ? "page" : undefined}
            className={styles.tab}
          >
            {item.label}
          </Tab>
        );
      })}
    </nav>
  );
}
