import { CryptoSurfaceSkeleton } from "@/features/crypto/components/CryptoSurfaceSkeleton";
import styles from "./page.module.css";

export default function Loading() {
  return (
    <main className={styles.main}>
      <CryptoSurfaceSkeleton />
    </main>
  );
}
