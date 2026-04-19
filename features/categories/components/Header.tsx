import Link from "next/link";
import { CategoryNav } from "./CategoryNav";
import styles from "./Header.module.css";

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo} aria-label="Polymarket Clone home">
          <span aria-hidden="true" className={styles.logoMark}>
            P
          </span>
          <span className={styles.logoText}>Polymarket</span>
        </Link>
        <CategoryNav />
      </div>
    </header>
  );
}
