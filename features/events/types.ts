export interface PolymarketTag {
  id: string;
  slug: string;
  label: string;
  forceHide?: boolean;
}

export interface PolymarketMarket {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  groupItemTitle?: string;
  image?: string;
  icon?: string;
  endDate?: string;

  outcomes: string[];
  outcomePrices: number[];
  clobTokenIds: string[];

  volumeNum: number;
  liquidityNum: number;

  lastTradePrice: number;
  bestBid: number;
  bestAsk: number;
  volume24hr: number;
  oneDayPriceChange: number;
  spread: number;

  acceptingOrders: boolean;
  closed: boolean;
}

export interface PolymarketEvent {
  id: string;
  ticker: string;
  slug: string;
  title: string;
  description?: string;

  startDate?: string;
  creationDate?: string;
  endDate?: string;

  image?: string;
  icon?: string;

  active: boolean;
  closed: boolean;
  archived: boolean;
  featured: boolean;
  restricted: boolean;

  liquidity: number;
  volume: number;
  volume24hr: number;
  volume1wk?: number;
  volume1mo?: number;
  volume1yr?: number;
  openInterest?: number;

  negRisk: boolean;
  commentCount?: number;
  showAllOutcomes: boolean;
  showMarketImages: boolean;

  markets: PolymarketMarket[];
  tags: PolymarketTag[];
}
