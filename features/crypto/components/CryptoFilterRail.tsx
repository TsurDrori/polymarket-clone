import type { CSSProperties } from "react";
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
  options: ReadonlyArray<{
    value: string;
    label: string;
    count: number;
  }>;
  activeValue: string;
  getHref: (value: string) => string;
  getMark: (value: string, label: string) => string;
  getTone: (value: string) => {
    bg: string;
    fg: string;
  };
  onNavigate?: (value: string) => void;
};

const TIME_MARKS: Record<string, string> = {
  all: "AL",
  "5m": "5M",
  "15m": "15",
  "1h": "1H",
  "4h": "4H",
  daily: "DY",
  weekly: "WK",
  monthly: "MO",
  yearly: "YR",
  "pre-market": "PM",
};

const ASSET_MARKS: Record<string, string> = {
  all: "AL",
  bitcoin: "BT",
  ethereum: "ET",
  solana: "SO",
  xrp: "XR",
  dogecoin: "DG",
  bnb: "BN",
  microstrategy: "MS",
};

const TIME_TONES: Record<string, { bg: string; fg: string }> = {
  default: { bg: "#EEF2F6", fg: "#667487" },
  all: { bg: "#EEF2F6", fg: "#667487" },
  "5m": { bg: "#EEF2F6", fg: "#667487" },
  "15m": { bg: "#EEF2F6", fg: "#667487" },
  "1h": { bg: "#EEF2F6", fg: "#667487" },
  "4h": { bg: "#EEF2F6", fg: "#667487" },
  daily: { bg: "#EEF2F6", fg: "#667487" },
  weekly: { bg: "#EEF2F6", fg: "#667487" },
  monthly: { bg: "#EEF2F6", fg: "#667487" },
  yearly: { bg: "#EEF2F6", fg: "#667487" },
  "pre-market": { bg: "#EEF2F6", fg: "#667487" },
};

const ASSET_TONES: Record<string, { bg: string; fg: string }> = {
  default: { bg: "#EEF2F6", fg: "#667487" },
  all: { bg: "#EEF2F6", fg: "#667487" },
  bitcoin: { bg: "#FCE6DB", fg: "#E06D2C" },
  ethereum: { bg: "#ECEBFA", fg: "#6A72E8" },
  solana: { bg: "#F2EAFE", fg: "#8B47E8" },
  xrp: { bg: "#EEF2F6", fg: "#1C232B" },
  dogecoin: { bg: "#FBF1D8", fg: "#C69C2C" },
  bnb: { bg: "#FDF2D6", fg: "#C79518" },
  microstrategy: { bg: "#EEF2F6", fg: "#667487" },
};

function RailSection({
  options,
  activeValue,
  getHref,
  getMark,
  getTone,
  onNavigate,
}: RailSectionProps) {
  return (
    <div className={styles.optionList}>
      {options.map((option) => {
        const active = activeValue === option.value;
        const tone = getTone(option.value);
        return (
          <CryptoFilterLink
            key={option.value}
            href={getHref(option.value)}
            className={cn(styles.option, active && styles.optionActive)}
            aria-current={active ? "page" : undefined}
            active={active}
            onNavigate={() => onNavigate?.(option.value)}
          >
            <span className={styles.optionLead}>
              <span
                className={styles.optionMark}
                aria-hidden="true"
                style={
                  {
                    "--rail-mark-bg": tone.bg,
                    "--rail-mark-fg": tone.fg,
                  } as CSSProperties
                }
              >
                {getMark(option.value, option.label)}
              </span>
              <span className={styles.optionLabel}>{option.label}</span>
            </span>
            <span className={styles.optionCount}>{option.count}</span>
          </CryptoFilterLink>
        );
      })}
    </div>
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
        options={timeOptions}
        activeValue={filters.time}
        getHref={(value) =>
          getCryptoFilterHref(filters, { time: value as CryptoFilterState["time"] })
        }
        getMark={(value, label) =>
          TIME_MARKS[value] ?? label.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase()
        }
        getTone={(value) => TIME_TONES[value] ?? TIME_TONES.default}
        onNavigate={(value) =>
          onFiltersChange?.({ time: value as CryptoFilterState["time"] })
        }
      />

      {assetOptions.length > 0 ? (
        <>
          <div className={styles.divider} aria-hidden="true" />
          <RailSection
            options={assetOptions}
            activeValue={filters.asset}
            getHref={(value) =>
              getCryptoFilterHref(filters, { asset: value as CryptoFilterState["asset"] })
            }
            getMark={(value, label) =>
              ASSET_MARKS[value] ?? label.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase()
            }
            getTone={(value) => ASSET_TONES[value] ?? ASSET_TONES.default}
            onNavigate={(value) =>
              onFiltersChange?.({ asset: value as CryptoFilterState["asset"] })
            }
          />
        </>
      ) : null}
    </aside>
  );
}
