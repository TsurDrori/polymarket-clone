"use client";

import { usePathname } from "next/navigation";
import { Tab } from "@/shared/ui/Tab";
import { isTabActive } from "../activeTab";
import { HEADER_MARKET_ITEMS, TrendingMark } from "./navItems";
import styles from "./CategoryNav.module.css";

export function CategoryNav() {
  const pathname = usePathname() ?? "/";
  return (
    <nav aria-label="Browse markets" className={styles.nav}>
      {HEADER_MARKET_ITEMS.flatMap((item, index) => {
        const activeHref = item.activeMatch ?? item.href ?? "/";
        const active = isTabActive(pathname, activeHref);

        const elements = [
          <Tab
            key={item.label}
            href={item.href ?? "#"}
            aria-current={active ? "page" : undefined}
            className={styles.tab}
          >
            {item.label === "Trending" ? (
              <TrendingMark aria-hidden="true" className={styles.trendingIcon} />
            ) : null}
            {item.label}
          </Tab>
        ];

        if (index === 0) {
          elements.push(
            <span
              key="header-nav-separator"
              aria-hidden="true"
              className={styles.separator}
            />,
          );
        }

        return elements;
      })}
    </nav>
  );
}
