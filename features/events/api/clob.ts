class ClobError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ClobError";
  }
}

type MarketPriceHistoryPoint = {
  t: number;
  p: number;
};

type PriceHistoryInterval = "1h" | "6h" | "1d" | "1w" | "1m" | "max" | "all";

const CLOB_BASE = "https://clob.polymarket.com";

const normalizePriceHistory = (payload: unknown): MarketPriceHistoryPoint[] => {
  if (!payload || typeof payload !== "object" || !("history" in payload)) {
    return [];
  }

  const history = (payload as { history?: unknown }).history;
  if (!Array.isArray(history)) return [];

  return history
    .map((point) => {
      if (!point || typeof point !== "object") return null;
      const rawTimestamp = (point as { t?: unknown }).t;
      const rawPrice = (point as { p?: unknown }).p;
      const timestamp =
        typeof rawTimestamp === "number" ? rawTimestamp : Number(rawTimestamp);
      const price = typeof rawPrice === "number" ? rawPrice : Number(rawPrice);

      if (!Number.isFinite(timestamp) || !Number.isFinite(price)) {
        return null;
      }

      return {
        t: timestamp,
        p: Math.min(1, Math.max(0, price)),
      };
    })
    .filter((point): point is MarketPriceHistoryPoint => point !== null)
    .sort((left, right) => left.t - right.t);
};

export const getMarketPriceHistory = async ({
  tokenId,
  interval = "1w",
  fidelity = 60,
}: {
  tokenId: string;
  interval?: PriceHistoryInterval;
  fidelity?: number;
}): Promise<MarketPriceHistoryPoint[]> => {
  const params = new URLSearchParams();

  // Polymarket names this parameter "market", but the endpoint expects a token ID.
  params.set("market", tokenId);
  params.set("interval", interval);
  params.set("fidelity", String(fidelity));

  const res = await fetch(`${CLOB_BASE}/prices-history?${params.toString()}`, {
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new ClobError(
      `getMarketPriceHistory failed: ${res.status} ${res.statusText}`,
      res.status,
    );
  }

  return normalizePriceHistory(await res.json());
};
