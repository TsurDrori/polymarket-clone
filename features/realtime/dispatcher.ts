import { enqueue } from "./rafBatcher";

type BookMessage = {
  event_type: "book";
  asset_id?: string;
  timestamp?: string | number;
  last_trade_price?: string | number;
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

const getOptionalNumber = (value: string | number | undefined): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const isKnownMessage = (value: unknown): value is KnownMessage =>
  isRecord(value) && typeof value.event_type === "string";

export const applyBook = (message: BookMessage): void => {
  if (!message.asset_id) {
    return;
  }

  const price = Number(message.last_trade_price);

  if (Number.isNaN(price) || price === 0) {
    return;
  }

  enqueue(message.asset_id, {
    price,
    ts: getTimestamp(message.timestamp),
  });
};

export const applyPriceChange = (message: PriceChangeMessage): void => {
  if (!Array.isArray(message.price_changes)) {
    return;
  }

  const ts = getTimestamp(message.timestamp);

  for (const change of message.price_changes) {
    if (!change.asset_id) {
      continue;
    }

    const price = Number(change.price);

    if (Number.isNaN(price)) {
      continue;
    }

    enqueue(change.asset_id, {
      price,
      bestBid: getOptionalNumber(change.best_bid),
      bestAsk: getOptionalNumber(change.best_ask),
      ts,
    });
  }
};

export const applyLastTradePrice = (message: LastTradePriceMessage): void => {
  if (!message.asset_id) {
    return;
  }

  const price = Number(message.price);

  if (Number.isNaN(price)) {
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
