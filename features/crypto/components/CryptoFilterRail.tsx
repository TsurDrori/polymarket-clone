import { cn } from "@/shared/lib/cn";
import {
  ASSET_LABELS,
  TIME_LABELS,
  getCryptoFilterHref,
  type CryptoFacetRail,
  type CryptoFilterState,
} from "../parse";
import { CryptoFilterLink } from "./CryptoFilterLink";
import styles from "./CryptoFilterRail.module.css";

type CryptoFilterRailProps = {
  rail: CryptoFacetRail;
  filters: CryptoFilterState;
  onFiltersChange?: (patch: Partial<CryptoFilterState>) => void;
};

type RailSectionProps = {
  sectionId: string;
  heading: string;
  options: ReadonlyArray<{
    value: string;
    label: string;
    count: number;
  }>;
  activeValue: string;
  getHref: (value: string) => string;
  onNavigate?: (value: string) => void;
};

function RailSection({
  sectionId,
  heading,
  options,
  activeValue,
  getHref,
  onNavigate,
}: RailSectionProps) {
  return (
    <section className={styles.section} aria-labelledby={sectionId}>
      <h2 id={sectionId} className={styles.heading}>
        {heading}
      </h2>
      <div className={styles.optionList}>
        {options.map((option) => {
          const active = activeValue === option.value;
          return (
            <CryptoFilterLink
              key={option.value}
              href={getHref(option.value)}
              className={cn(styles.option, active && styles.optionActive)}
              aria-current={active ? "page" : undefined}
              active={active}
              onNavigate={() => onNavigate?.(option.value)}
            >
              <span className={styles.optionLabel}>{option.label}</span>
              <span className={styles.optionCount}>{option.count}</span>
            </CryptoFilterLink>
          );
        })}
      </div>
    </section>
  );
}

export function CryptoFilterRail({
  rail,
  filters,
  onFiltersChange,
}: CryptoFilterRailProps) {
  const timeOptions = rail.timeOptions.map((option) => ({
    ...option,
    label: TIME_LABELS[option.value],
  }));
  const assetOptions = rail.assetOptions.map((option) => ({
    ...option,
    label: ASSET_LABELS[option.value],
  }));

  return (
    <aside className={styles.rail} aria-label="Crypto filters">
      <RailSection
        sectionId="crypto-filter-markets-heading"
        heading="Markets"
        options={timeOptions}
        activeValue={filters.time}
        getHref={(value) =>
          getCryptoFilterHref(filters, { time: value as CryptoFilterState["time"] })
        }
        onNavigate={(value) =>
          onFiltersChange?.({ time: value as CryptoFilterState["time"] })
        }
      />

      {assetOptions.length > 0 ? (
        <RailSection
          sectionId="crypto-filter-assets-heading"
          heading="Assets"
          options={assetOptions}
          activeValue={filters.asset}
          getHref={(value) =>
            getCryptoFilterHref(filters, { asset: value as CryptoFilterState["asset"] })
          }
          onNavigate={(value) =>
            onFiltersChange?.({ asset: value as CryptoFilterState["asset"] })
          }
        />
      ) : null}
    </aside>
  );
}
