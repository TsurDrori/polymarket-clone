import Link from "next/link";
import { CategoryNav } from "./CategoryNav";
import styles from "./Header.module.css";

const BROWSE_ITEMS = [
  "New",
  "Trending",
  "Popular",
  "Liquid",
  "Ending Soon",
  "Competitive",
];

const TOPIC_ITEMS = [
  "Live Crypto",
  "Politics",
  "Middle East",
  "Crypto",
  "Sports",
  "Pop Culture",
  "Tech",
  "AI",
];

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.topRow}>
          <Link href="/" className={styles.logo} aria-label="Polymarket Clone home">
            <span aria-hidden="true" className={styles.logoMark}>
              P
            </span>
            <span className={styles.logoText}>Polymarket</span>
          </Link>

          <div className={styles.desktopGroups}>
            <div className={styles.utilityGroup}>
              <span className={styles.utilityLabel}>Browse</span>
              <nav aria-label="Browse trends" className={styles.utilityNav}>
                {BROWSE_ITEMS.map((item) => (
                  <span key={item} className={styles.utilityLink}>
                    {item}
                  </span>
                ))}
              </nav>
            </div>

            <div className={styles.utilityGroup}>
              <span className={styles.utilityLabel}>Topics</span>
              <nav aria-label="Popular topics" className={styles.utilityNav}>
                {TOPIC_ITEMS.map((item) => (
                  <span key={item} className={styles.utilityLink}>
                    {item}
                  </span>
                ))}
              </nav>
            </div>
          </div>
        </div>

        <CategoryNav />
      </div>
    </header>
  );
}
