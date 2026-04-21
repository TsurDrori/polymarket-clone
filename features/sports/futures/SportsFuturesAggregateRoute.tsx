import Link from "next/link";
import { Bookmark, Search, SlidersHorizontal } from "lucide-react";
import {
  formatCompactCount,
  type SportsFuturesAggregateRailItem,
} from "./liveContract";
import styles from "./SportsFuturesAggregateRoute.module.css";

type SportsFuturesAggregateRouteProps = {
  allCountLabel: string;
  railItems: ReadonlyArray<SportsFuturesAggregateRailItem>;
};

function AggregateRail({
  allCountLabel,
  railItems,
}: SportsFuturesAggregateRouteProps) {
  return (
    <nav className={styles.rail} aria-label="Sports futures taxonomy">
      <Link href="/sports/futures" className={styles.railItem} data-active="true">
        <span>All</span>
        <span className={styles.railCount}>{allCountLabel}</span>
      </Link>

      {railItems.map((item) => (
        <Link key={item.slug} href={item.href} className={styles.railItem}>
          <span>{item.label}</span>
          <span className={styles.railCount}>{formatCompactCount(item.count)}</span>
        </Link>
      ))}
    </nav>
  );
}

export function SportsFuturesAggregateRoute({
  allCountLabel,
  railItems,
}: SportsFuturesAggregateRouteProps) {
  return (
    <section className={styles.surface}>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <AggregateRail allCountLabel={allCountLabel} railItems={railItems} />
        </aside>

        <div className={styles.board}>
          <header className={styles.header}>
            <h1 className={styles.title}>futures</h1>

            <div className={styles.tools} aria-label="Futures utilities">
              <button type="button" className={styles.toolButton} aria-label="Search futures">
                <Search size={16} strokeWidth={2.2} />
              </button>
              <button type="button" className={styles.toolButton} aria-label="Filter futures">
                <SlidersHorizontal size={16} strokeWidth={2.2} />
              </button>
              <button type="button" className={styles.toolButton} aria-label="Bookmark futures">
                <Bookmark size={16} strokeWidth={2.2} />
              </button>
            </div>
          </header>

          <div className={styles.emptyCanvas}>
            <p className={styles.emptyLabel}>No results found</p>
          </div>
        </div>
      </div>
    </section>
  );
}
