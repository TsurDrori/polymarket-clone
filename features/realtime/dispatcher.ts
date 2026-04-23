import { enqueue } from "./rafBatcher";

type BookMessage = {
  event_type: "book";
  asset_id?: string;
  timestamp?: string | number;
  last_trade_price?: string | number;
  bids?: Array<{ price?: string | number; size?: string | number }>;
  asks?: Array<{ price?: string | number; size?: string | number }>;
};

type PriceChangeEntry = {
  asset_id?: string;
  price?: string | number;
  best_bid?: string | number;
  best_ask?: string | number;
};

type PriceChangeMessage = {
  event_type: "price_change";
  timestamp?: string | number;
  price_changes?: PriceChangeEntry[];
};

type LastTradePriceMessage = {
  event_type: "last_trade_price";
  asset_id?: string;
  timestamp?: string | number;
  price?: string | number;
};

type KnownMessage = BookMessage | PriceChangeMessage | LastTradePriceMessage;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getTimestamp = (value: string | number | undefined): number =>
  Number(value) || Date.now();

const getNumber = (value: string | number | undefined): number | null => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const isKnownMessage = (value: unknown): value is KnownMessage =>
  isRecord(value) && typeof value.event_type === "string";

const getBestBid = (
  levels: ReadonlyArray<{ price?: string | number }> | undefined,
): number => {
  let bestBid = 0;

  for (const level of levels ?? []) {
    const price = getNumber(level.price);

    if (price === null) {
      continue;
    }

    bestBid = Math.max(bestBid, price);
  }

  return bestBid;
};

const getBestAsk = (
  levels: ReadonlyArray<{ price?: string | number }> | undefined,
): number => {
  let bestAsk = Number.POSITIVE_INFINITY;

  for (const level of levels ?? []) {
    const price = getNumber(level.price);

    if (price === null || price < 0) {
      continue;
    }

    bestAsk = Math.min(bestAsk, price);
  }

  return Number.isFinite(bestAsk) ? bestAsk : 0;
};

const applyBook = (message: BookMessage): void => {
  if (!message.asset_id) {
    return;
  }

  const bestBid = getBestBid(message.bids);
  const bestAsk = getBestAsk(message.asks);
  const lastTradePrice = getNumber(message.last_trade_price);
  let displayPrice: number | undefined;

  if (bestAsk > 0) {
    displayPrice = bestAsk;
  } else if (lastTradePrice !== null && lastTradePrice > 0) {
    displayPrice = lastTradePrice;
  }

  if (displayPrice === undefined && bestBid === 0 && bestAsk === 0) {
    return;
  }

  enqueue(message.asset_id, {
    ...(displayPrice !== undefined ? { price: displayPrice } : {}),
    bestBid,
    bestAsk,
    ts: getTimestamp(message.timestamp),
  });
};

const applyPriceChange = (message: PriceChangeMessage): void => {
  if (!Array.isArray(message.price_changes)) {
    return;
  }

  const ts = getTimestamp(message.timestamp);

  for (const change of message.price_changes) {
    if (!change.asset_id) {
      continue;
    }

    const bestBid = getNumber(change.best_bid);
    const bestAsk = getNumber(change.best_ask);

    if (bestBid === null && bestAsk === null) {
      continue;
    }

    const nextTick = {
      ...(bestBid !== null ? { bestBid } : {}),
      ...(bestAsk !== null ? { bestAsk } : {}),
      ...(bestAsk !== null && bestAsk > 0 ? { price: bestAsk } : {}),
      ts,
    };

    enqueue(change.asset_id, {
      ...nextTick,
    });
  }
};

const applyLastTradePrice = (message: LastTradePriceMessage): void => {
  if (!message.asset_id) {
    return;
  }

  const price = getNumber(message.price);

  if (price === null) {
    return;
  }

  enqueue(message.asset_id, {
    price,
    ts: getTimestamp(message.timestamp),
  });
};

export const handleMessage = (raw: string): void => {
  if (raw === "PONG") {
    return;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return;
  }

  const messages = Array.isArray(parsed) ? parsed : [parsed];

  for (const message of messages) {
    if (!isKnownMessage(message)) {
      continue;
    }

    switch (message.event_type) {
      case "book":
        applyBook(message);
        break;
      case "price_change":
        applyPriceChange(message);
        break;
      case "last_trade_price":
        applyLastTradePrice(message);
        break;
      default:
        break;
    }
  }
};
