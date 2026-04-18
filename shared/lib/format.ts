const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const formatPct = (price: number): string => {
  if (!Number.isFinite(price)) return "0%";
  return `${Math.round(price * 100)}%`;
};

export const formatCents = (price: number): string => {
  if (!Number.isFinite(price)) return "0.0¢";
  const cents = price * 100;
  return `${cents.toFixed(1)}¢`;
};

export const formatVolume = (value: number): string => {
  if (!Number.isFinite(value) || value <= 0) return "$0";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${Math.floor(value / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `$${Math.floor(value / 1_000_000)}M`;
  if (abs >= 1_000) return `$${Math.floor(value / 1_000)}K`;
  return `$${Math.floor(value)}`;
};

export const formatFullUSD = (value: number): string => {
  if (!Number.isFinite(value)) return "$0";
  return `$${Math.round(value).toLocaleString("en-US")}`;
};

export const formatEndDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
};
