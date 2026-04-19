import type {
  PolymarketEvent,
  PolymarketMarket,
  PolymarketTag,
} from "../types";

type RawTag = {
  id?: unknown;
  slug?: unknown;
  label?: unknown;
  forceHide?: unknown;
};

type RawMarket = {
  id?: unknown;
  question?: unknown;
  conditionId?: unknown;
  slug?: unknown;
  groupItemTitle?: unknown;
  image?: unknown;
  icon?: unknown;
  endDate?: unknown;
  outcomes?: unknown;
  outcomePrices?: unknown;
  clobTokenIds?: unknown;
  volume?: unknown;
  volume24hr?: unknown;
  liquidity?: unknown;
  lastTradePrice?: unknown;
  bestBid?: unknown;
  bestAsk?: unknown;
  oneDayPriceChange?: unknown;
  spread?: unknown;
  acceptingOrders?: unknown;
  closed?: unknown;
};

type RawEvent = {
  id?: unknown;
  ticker?: unknown;
  slug?: unknown;
  title?: unknown;
  description?: unknown;
  startDate?: unknown;
  creationDate?: unknown;
  endDate?: unknown;
  image?: unknown;
  icon?: unknown;
  active?: unknown;
  closed?: unknown;
  archived?: unknown;
  featured?: unknown;
  restricted?: unknown;
  liquidity?: unknown;
  volume?: unknown;
  volume24hr?: unknown;
  volume1wk?: unknown;
  volume1mo?: unknown;
  volume1yr?: unknown;
  openInterest?: unknown;
  negRisk?: unknown;
  commentCount?: unknown;
  showAllOutcomes?: unknown;
  showMarketImages?: unknown;
  markets?: unknown;
  tags?: unknown;
};

const isString = (v: unknown): v is string => typeof v === "string";
const isNonEmptyString = (v: unknown): v is string =>
  typeof v === "string" && v.length > 0;

const toNumber = (v: unknown): number => {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.length > 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

const toBool = (v: unknown): boolean => v === true;

const parseStringArray = (raw: unknown): string[] => {
  if (!isString(raw)) return [];
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.map((x) => String(x));
};

const parseNumberArray = (raw: unknown): number[] => {
  if (!isString(raw)) return [];
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.map((x) => Number(x));
};

const parseTag = (raw: RawTag): PolymarketTag => ({
  id: String(raw.id ?? ""),
  slug: isString(raw.slug) ? raw.slug : "",
  label: isString(raw.label) ? raw.label : "",
  forceHide: toBool(raw.forceHide),
});

const parseMarket = (raw: RawMarket): PolymarketMarket => ({
  id: String(raw.id ?? ""),
  question: isString(raw.question) ? raw.question : "",
  conditionId: isString(raw.conditionId) ? raw.conditionId : "",
  slug: isString(raw.slug) ? raw.slug : "",
  groupItemTitle: isString(raw.groupItemTitle) ? raw.groupItemTitle : undefined,
  image: isString(raw.image) ? raw.image : undefined,
  icon: isString(raw.icon) ? raw.icon : undefined,
  endDate: isString(raw.endDate) ? raw.endDate : undefined,

  outcomes: parseStringArray(raw.outcomes),
  outcomePrices: parseNumberArray(raw.outcomePrices),
  clobTokenIds: parseStringArray(raw.clobTokenIds),

  volumeNum: toNumber(raw.volume),
  liquidityNum: toNumber(raw.liquidity),

  lastTradePrice: toNumber(raw.lastTradePrice),
  bestBid: toNumber(raw.bestBid),
  bestAsk: toNumber(raw.bestAsk),
  volume24hr: toNumber(raw.volume24hr),
  oneDayPriceChange: toNumber(raw.oneDayPriceChange),
  spread: toNumber(raw.spread),

  acceptingOrders: toBool(raw.acceptingOrders),
  closed: toBool(raw.closed),
});

export const isValidEvent = (raw: unknown): raw is RawEvent => {
  if (!raw || typeof raw !== "object") return false;
  const e = raw as RawEvent;
  if (!isNonEmptyString(e.slug)) return false;
  if (!isNonEmptyString(e.title)) return false;
  if (!Array.isArray(e.markets) || e.markets.length === 0) return false;
  for (const m of e.markets as RawMarket[]) {
    if (!m || typeof m !== "object") return false;
    if (!isNonEmptyString(m.question)) return false;
    if (!isString(m.outcomes)) return false;
    if (!isString(m.clobTokenIds)) return false;
  }
  return true;
};

export const parseEvent = (raw: unknown): PolymarketEvent => {
  const e = raw as RawEvent;
  const rawMarkets = Array.isArray(e.markets) ? (e.markets as RawMarket[]) : [];
  const rawTags = Array.isArray(e.tags) ? (e.tags as RawTag[]) : [];

  return {
    id: String(e.id ?? ""),
    ticker: isString(e.ticker) ? e.ticker : "",
    slug: isString(e.slug) ? e.slug : "",
    title: isString(e.title) ? e.title : "",
    description: isString(e.description) ? e.description : undefined,

    startDate: isString(e.startDate) ? e.startDate : undefined,
    creationDate: isString(e.creationDate) ? e.creationDate : undefined,
    endDate: isString(e.endDate) ? e.endDate : undefined,

    image: isString(e.image) ? e.image : undefined,
    icon: isString(e.icon) ? e.icon : undefined,

    active: toBool(e.active),
    closed: toBool(e.closed),
    archived: toBool(e.archived),
    featured: toBool(e.featured),
    restricted: toBool(e.restricted),

    liquidity: toNumber(e.liquidity),
    volume: toNumber(e.volume),
    volume24hr: toNumber(e.volume24hr),
    volume1wk: e.volume1wk === undefined ? undefined : toNumber(e.volume1wk),
    volume1mo: e.volume1mo === undefined ? undefined : toNumber(e.volume1mo),
    volume1yr: e.volume1yr === undefined ? undefined : toNumber(e.volume1yr),
    openInterest:
      e.openInterest === undefined ? undefined : toNumber(e.openInterest),

    negRisk: toBool(e.negRisk),
    commentCount:
      e.commentCount === undefined ? undefined : toNumber(e.commentCount),
    showAllOutcomes: toBool(e.showAllOutcomes),
    showMarketImages: toBool(e.showMarketImages),

    markets: rawMarkets.map(parseMarket),
    tags: rawTags.map(parseTag),
  };
};

export const getEventImage = (event: PolymarketEvent): string | null => {
  if (event.image) return event.image;
  if (event.icon) return event.icon;
  for (const m of event.markets) {
    if (m.image) return m.image;
    if (m.icon) return m.icon;
  }
  return null;
};
