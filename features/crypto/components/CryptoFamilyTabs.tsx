import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import {
  FAMILY_LABELS,
  getCryptoFilterHref,
  type CryptoFacetOption,
  type CryptoFamily,
  type CryptoFilterState,
} from "../parse";
import styles from "./CryptoFamilyTabs.module.css";

type CryptoFamilyTabsProps = {
  options: ReadonlyArray<CryptoFacetOption<CryptoFamily>>;
  filters: CryptoFilterState;
};

export function CryptoFamilyTabs({
  options,
  filters,
}: CryptoFamilyTabsProps) {
  return (
    <nav aria-label="Crypto market families" className={styles.tabs}>
      {options.map((option) => {
        const active = filters.family === option.value;
        return (
          <Link
            key={option.value}
            href={getCryptoFilterHref(filters, { family: option.value })}
            className={cn(styles.tab, active && styles.tabActive)}
            aria-current={active ? "page" : undefined}
            aria-label={`${FAMILY_LABELS[option.value]} (${option.count})`}
          >
            {option.label}
          </Link>
        );
      })}
    </nav>
  );
}
