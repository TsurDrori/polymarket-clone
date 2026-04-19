import Link from "next/link";
import styles from "@/app/error.module.css";

export default function EventNotFound() {
  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>Market not found</h1>
        <p className={styles.message}>
          This event slug doesn&apos;t exist or is no longer available from the
          Gamma feed.
        </p>
        <Link href="/" className={styles.retry}>
          Back to trending markets
        </Link>
      </div>
    </main>
  );
}
