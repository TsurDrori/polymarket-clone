import type { SportsbookMarketCell } from "./parse";
import { MarketColumn } from "./MarketColumn";

type MoneylineCellProps = {
  entries: ReadonlyArray<SportsbookMarketCell>;
};

export function MoneylineCell({ entries }: MoneylineCellProps) {
  return <MarketColumn entries={entries} />;
}
