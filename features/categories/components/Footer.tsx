import Link from "next/link";
import styles from "./Footer.module.css";

const MARKET_LINKS = [
  { label: "Sports Odds & predictions", href: "/sports" },
  { label: "Crypto price predictions", href: "/crypto" },
  { label: "Political odds & predictions", href: "/politics" },
  { label: "Tech trends & predictions", href: "/" },
  { label: "Culture trends & predictions", href: "/" },
  { label: "World trends & predictions", href: "/" },
  { label: "Election forecasts & predictions", href: "/politics" },
  { label: "Geopolitical predictions", href: "/" },
];

const SUPPORT_LINKS = [
  { label: "Learn", href: "https://docs.polymarket.com" },
  { label: "X", href: "https://x.com/polymarket" },
  { label: "Instagram", href: "https://www.instagram.com/polymarkethq/" },
  { label: "Discord", href: "https://discord.gg/polymarket" },
  { label: "TikTok", href: "https://www.tiktok.com/@polymarket" },
  { label: "News", href: "https://news.polymarket.com" },
  { label: "Help Center", href: "https://help.polymarket.com" },
];

const PRODUCT_LINKS = [
  { label: "Rewards", href: "https://polymarket.com/rewards" },
  { label: "APIs", href: "https://docs.polymarket.com" },
  { label: "Leaderboard", href: "https://polymarket.com/leaderboard" },
  { label: "Accuracy", href: "https://polymarket.com/accuracy" },
  { label: "Brand", href: "https://polymarket.com/brand" },
  { label: "Activity", href: "https://polymarket.com/activity" },
  { label: "Careers", href: "https://jobs.ashbyhq.com/polymarket" },
];

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandColumn}>
          <Link href="/" className={styles.brand}>
            <span className={styles.logoMark} aria-hidden="true">
              P
            </span>
            <span className={styles.brandText}>Polymarket</span>
          </Link>
          <p className={styles.brandCopy}>
            The world&apos;s largest prediction market surface, recreated with
            recruiter-grade craftsmanship and live Polymarket data.
          </p>
        </div>

        <div className={styles.linkGrid}>
          <section className={styles.linkSection}>
            <h2 className={styles.sectionTitle}>Markets by category and topics</h2>
            <div className={styles.linkList}>
              {MARKET_LINKS.map((link) => (
                <Link key={link.label} href={link.href} className={styles.link}>
                  {link.label}
                </Link>
              ))}
            </div>
          </section>

          <section className={styles.linkSection}>
            <h2 className={styles.sectionTitle}>Support & Social</h2>
            <div className={styles.linkList}>
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
            </div>
          </section>

          <section className={styles.linkSection}>
            <h2 className={styles.sectionTitle}>Polymarket</h2>
            <div className={styles.linkList}>
              {PRODUCT_LINKS.map((link) => (
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
            </div>
          </section>
        </div>

        <div className={styles.legal}>
          <p className={styles.legalLine}>
            Adventure One QSS Inc. © 2026 · Privacy · Terms of Use · Market
            Integrity · Help Center · Docs
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
