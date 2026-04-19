import type { SportsbookMarketCell } from "./parse";
import { MarketColumn } from "./MarketColumn";

type TotalCellProps = {
  entries: ReadonlyArray<SportsbookMarketCell>;
};

export function TotalCell({ entries }: TotalCellProps) {
  return <MarketColumn entries={entries} />;
}
