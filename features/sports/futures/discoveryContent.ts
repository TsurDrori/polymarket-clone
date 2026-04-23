type SportsFuturesFaqItem = {
  question: string;
  answer: string;
};

export type SportsFuturesLinkItem = {
  label: string;
  href: string;
  sublabel?: string;
};

export const SPORTS_FUTURES_FAQ: ReadonlyArray<SportsFuturesFaqItem> = [
  {
    question: "What is Polymarket?",
    answer:
      "Polymarket is a prediction market where prices reflect crowd-implied probabilities for real-world outcomes across sports, crypto, politics, and more.",
  },
  {
    question: "What is a futures prediction market?",
    answer:
      "A futures market lets traders take positions on longer-horizon outcomes before the underlying event resolves, with prices moving as the crowd updates its expectations.",
  },
  {
    question: "What sports topics can I trade here?",
    answer:
      "The sports category spans league winners, awards, transfers, tournaments, and other season-long outcomes, alongside dedicated live game routes.",
  },
  {
    question: "How do sports odds work on Polymarket?",
    answer:
      "Each price is quoted between 0 and 100 cents and maps to an implied probability, so a 64 cent price roughly signals a 64% crowd expectation.",
  },
  {
    question: "How are sports markets resolved?",
    answer:
      "Each event resolves against the market rules and named sources on its detail page, usually after an official result, standings update, or deadline.",
  },
  {
    question: "Why do futures prices move so often?",
    answer:
      "Odds react to injuries, transfers, standings, roster news, and every major development that changes the market's expectation for the final outcome.",
  },
];

export const SPORTS_FUTURES_RELATED_TOPICS: ReadonlyArray<SportsFuturesLinkItem> = [
  { label: "Fed", href: "/predictions/fed", sublabel: "Predictions & odds" },
  { label: "Fomc", href: "/predictions/fomc", sublabel: "Predictions & odds" },
  { label: "Oil", href: "/predictions/oil", sublabel: "Predictions & odds" },
  {
    label: "Commodities",
    href: "/predictions/commodities",
    sublabel: "Predictions & odds",
  },
  {
    label: "Equities",
    href: "/predictions/equities",
    sublabel: "Predictions & odds",
  },
  { label: "Stocks", href: "/predictions/stocks", sublabel: "Predictions & odds" },
  { label: "IPO", href: "/predictions/ipo", sublabel: "Predictions & odds" },
  {
    label: "Indicies",
    href: "/predictions/indicies",
    sublabel: "Predictions & odds",
  },
  { label: "SPX", href: "/predictions/spx", sublabel: "Predictions & odds" },
  {
    label: "Uranium",
    href: "/predictions/uranium",
    sublabel: "Predictions & odds",
  },
];

export const SPORTS_FUTURES_POPULAR_MARKETS: ReadonlyArray<SportsFuturesLinkItem> = [
  {
    label: "What will WTI Crude Oil (WTI) hit in April 2026?",
    href: "/event/what-price-will-wti-hit-in-april-2026",
  },
  {
    label: "Largest Company end of April?",
    href: "/event/largest-company-end-of-april-738",
  },
  {
    label: "How many Fed rate cuts in 2026?",
    href: "/event/how-many-fed-rate-cuts-in-2026",
  },
  {
    label: "S&P 500 (SPX) Up or Down on April 20?",
    href: "/event/spx-up-or-down-on-april-20-2026",
  },
  {
    label: "S&P 500 (SPX) Opens Up or Down on April 20?",
    href: "/event/spx-opens-up-or-down-on-april-20-2026",
  },
  {
    label: "Which CEOs will be out before 2027?",
    href: "/event/which-ceos-will-be-out-before-2027",
  },
  {
    label: "SPY (SPY) Up or Down on April 20?",
    href: "/event/spy-up-or-down-on-april-20-2026",
  },
  {
    label: "2nd largest company end of April?",
    href: "/event/2nd-largest-company-end-of-april",
  },
  {
    label: "Largest Company end of June?",
    href: "/event/largest-company-end-of-june-712",
  },
  {
    label: "WTI Crude Oil (WTI) Up or Down on April 20?",
    href: "/event/wti-up-or-down-on-april-20-2026",
  },
];

export const SPORTS_FUTURES_NEW_MARKETS: ReadonlyArray<SportsFuturesLinkItem> = [
  {
    label: "Yesway IPO Closing Market Cap",
    href: "/event/yesway-ipo-closing-market-cap",
  },
  {
    label: "X-Energy IPO Closing Market Cap",
    href: "/event/x-energy-ipo-closing-market-cap",
  },
  {
    label: "Microsoft (MSFT) closes above ___ on April 21?",
    href: "/event/msft-close-above-on-april-21-2026",
  },
  {
    label: "Tesla (TSLA) closes above ___ on April 21?",
    href: "/event/tsla-close-above-on-april-21-2026",
  },
  {
    label: "Google (GOOGL) closes above ___ on April 21?",
    href: "/event/googl-close-above-on-april-21-2026",
  },
  {
    label: "Apple (AAPL) closes above ___ on April 21?",
    href: "/event/aapl-close-above-on-april-21-2026",
  },
  {
    label: "Palantir (PLTR) Up or Down on April 21?",
    href: "/event/pltr-up-or-down-on-april-21-2026",
  },
  {
    label: "WTI Crude Oil (WTI) Up or Down on April 21?",
    href: "/event/wti-up-or-down-on-april-21-2026",
  },
  {
    label: "Meta (META) closes above ___ on April 21?",
    href: "/event/meta-close-above-on-april-21-2026",
  },
  {
    label: "QQQ (QQQ) Up or Down on April 21?",
    href: "/event/qqq-up-or-down-on-april-21-2026",
  },
];
