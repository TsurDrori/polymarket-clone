import Link from "next/link";
import styles from "./Footer.module.css";

const MARKET_LINKS = [
  { label: "Trending", href: "/" },
  { label: "Politics", href: "/politics" },
  { label: "Sports", href: "/sports" },
  { label: "Crypto", href: "/crypto" },
] as const;

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
            <p className={styles.brandCopy}>
              Recruiter-grade Polymarket clone using public market data with a
              server-first shell and live-price-ready client islands.
            </p>
          </div>

          <nav aria-label="Market categories" className={styles.linkRow}>
            {MARKET_LINKS.map((link) => (
              <Link key={link.label} href={link.href} className={styles.link}>
                {link.label}
              </Link>
            ))}
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

        <div className={styles.legal}>
          <p className={styles.legalLine}>
            Adventure One QSS Inc. © 2026 · Built for the PLAEE Frontend
            Assignment.
          </p>
          <p className={styles.disclaimer}>
            Built by Tsur for the PLAEE Frontend Assignment, April 2026. This
            clone uses Polymarket public data for interface recreation only and
            is not an official product or trading venue.
          </p>
        </div>
      </div>
    </footer>
  );
}
