"use client";

import { usePathname } from "next/navigation";
import { Tab } from "@/shared/ui/Tab";
import { isTabActive } from "../activeTab";
import styles from "./CategoryNav.module.css";

type NavItem = { label: string; href: string };

const ITEMS: readonly NavItem[] = [
  { label: "Trending", href: "/" },
  { label: "Politics", href: "/politics" },
  { label: "Sports", href: "/sports" },
  { label: "Crypto", href: "/crypto" },
];

export function CategoryNav() {
  const pathname = usePathname() ?? "/";
  return (
    <nav aria-label="Categories" className={styles.nav}>
      {ITEMS.map((item) => {
        const active = isTabActive(pathname, item.href);
        return (
          <Tab
            key={item.href}
            href={item.href}
            role="link"
            aria-current={active ? "page" : undefined}
            aria-selected={active ? true : undefined}
          >
            {item.label}
          </Tab>
        );
      })}
    </nav>
  );
}
