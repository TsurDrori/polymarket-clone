import type { SportsbookMarketCell } from "./parse";
import { MarketColumn } from "./MarketColumn";

type SpreadCellProps = {
  entries: ReadonlyArray<SportsbookMarketCell>;
};

export function SpreadCell({ entries }: SpreadCellProps) {
  return <MarketColumn entries={entries} />;
}
