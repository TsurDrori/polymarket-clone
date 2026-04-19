import Link from "next/link";
import { CategoryNav } from "./CategoryNav";
import styles from "./Header.module.css";

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

          <div className={styles.meta}>
            <span className={styles.metaEyebrow}>Prediction markets</span>
            <span className={styles.metaCopy}>
              Server-rendered surfaces over live Polymarket data.
            </span>
          </div>
        </div>

        <CategoryNav />
      </div>
    </header>
  );
}
