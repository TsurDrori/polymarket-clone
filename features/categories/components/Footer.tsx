import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { CATEGORY_ITEMS } from "./navItems";
import styles from "./Footer.module.css";

const SUPPORT_LINKS = [
  { label: "Learn", href: "https://docs.polymarket.com" },
  { label: "News", href: "https://news.polymarket.com" },
  { label: "Help Center", href: "https://help.polymarket.com" },
  { label: "X", href: "https://x.com/polymarket" },
] as const;

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.topRow}>
          <div className={styles.brandColumn}>
            <Link href="/" className={styles.brand}>
              <span className={styles.logoMark} aria-hidden="true">
                P
              </span>
              <span className={styles.brandText}>Polymarket</span>
            </Link>
          </div>

          <nav aria-label="Market categories" className={styles.linkRow}>
            {CATEGORY_ITEMS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={cn(styles.link, styles.marketLink)}
                >
                  <Icon className={styles.linkIcon} aria-hidden="true" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <nav aria-label="Helpful resources" className={styles.linkRow}>
            {SUPPORT_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className={styles.link}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
