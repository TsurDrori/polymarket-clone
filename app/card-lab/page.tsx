import type { Metadata } from "next";
import { EventCard } from "@/features/events/components/EventCard";
import type {
  PolymarketEvent,
  PolymarketMarket,
  PolymarketTag,
} from "@/features/events/types";
import { CryptoCard } from "@/features/crypto/components/CryptoCard";
import type { CryptoCardModel } from "@/features/crypto/parse";
import { HomeMarketCard } from "@/features/home/components/HomeMarketCard";
import type {
  HomeBinaryCardModel,
  HomeCryptoUpDownCardModel,
  HomeSportsLiveCardModel,
} from "@/features/home/components/homeCardModel";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Card Lab | Polymarket Clone",
  description: "Internal route showing every card type in the project with fixed sample data.",
  robots: {
    index: false,
    follow: false,
  },
};

type LabSpecimenProps = {
  name: string;
  source: string;
  usage: string;
  route?: string;
  children: React.ReactNode;
  wide?: boolean;
};

function Specimen({
  name,
  source,
  usage,
  route,
  children,
  wide = false,
}: LabSpecimenProps) {
  return (
    <section className={styles.specimen} data-wide={wide ? "true" : "false"}>
      <header className={styles.specimenHeader}>
        <h2 className={styles.specimenTitle}>{name}</h2>
        <p className={styles.specimenSource}>{source}</p>
        <p className={styles.specimenUsage}>{usage}</p>
        {route ? <p className={styles.specimenRoute}>Route: {route}</p> : null}
      </header>
      <div className={styles.specimenBody}>{children}</div>
    </section>
  );
}

const placeholderImage = "/placeholder.svg";

const makeTag = (id: string, slug: string, label: string): PolymarketTag => ({
  id,
  slug,
  label,
});

const makeMarket = (
  id: string,
  question: string,
  overrides: Partial<PolymarketMarket> = {},
): PolymarketMarket => ({
  id,
  question,
  conditionId: `${id}-condition`,
  slug: id,
  line: null,
  outcomes: ["Yes", "No"],
  outcomePrices: [0.62, 0.38],
  clobTokenIds: [],
  volumeNum: 250_000,
  liquidityNum: 150_000,
  lastTradePrice: 0.62,
  bestBid: 0.61,
  bestAsk: 0.63,
  volume24hr: 75_000,
  oneDayPriceChange: 0.04,
  spread: 0.02,
  acceptingOrders: true,
  closed: false,
  ...overrides,
});

const makeEvent = (
  id: string,
  title: string,
  tags: PolymarketTag[],
  overrides: Partial<PolymarketEvent> = {},
): PolymarketEvent => ({
  id,
  ticker: id,
  slug: id,
  title,
  active: true,
  closed: false,
  archived: false,
  featured: true,
  restricted: false,
  liquidity: 1_200_000,
  volume: 2_400_000,
  volume24hr: 550_000,
  negRisk: false,
  showAllOutcomes: false,
  showMarketImages: false,
  markets: [makeMarket(`${id}-yesno`, title)],
  tags,
  ...overrides,
});

const eventGrouped = makeEvent(
  "lab-event-grouped",
  "Who will win the 2026 FIFA World Cup?",
  [makeTag("t3", "sports", "Sports"), makeTag("t4", "soccer", "Soccer")],
  {
    image: placeholderImage,
    icon: placeholderImage,
    showAllOutcomes: true,
    showMarketImages: true,
    markets: [
      makeMarket("lab-grouped-spain", "Spain", {
        groupItemTitle: "Spain",
        outcomePrices: [0.18, 0.82],
        lastTradePrice: 0.18,
      }),
      makeMarket("lab-grouped-brazil", "Brazil", {
        groupItemTitle: "Brazil",
        outcomePrices: [0.14, 0.86],
        lastTradePrice: 0.14,
      }),
    ],
  },
);

const homeBinary: HomeBinaryCardModel = {
  kind: "binary",
  theme: "general",
  title: "Will the Virginia redistricting referendum pass?",
  href: "/event/lab-event-binary",
  imageSrc: placeholderImage,
  metaLabels: ["Politics", "States"],
  primaryPrice: 0.84,
  primaryChange: 0.06,
  primaryDateLabel: "Nov 3",
  volumeLabel: "$593K Vol.",
  actions: [
    { label: "Yes", price: 0.84 },
    { label: "No", price: 0.16 },
  ],
};

const sportsBinary: HomeBinaryCardModel = {
  kind: "binary",
  theme: "sports",
  title: "Will Victor Wembanyama record a quadruple double this season?",
  href: "/event/lab-sports-binary",
  imageSrc: placeholderImage,
  metaLabels: ["NBA"],
  primaryPrice: 0.03,
  primaryChange: 0,
  primaryDateLabel: "Apr 30",
  volumeLabel: "$106K Vol.",
  actions: [
    { label: "Yes", price: 0.03 },
    { label: "No", price: 0.97 },
  ],
};

const homeCryptoUpDown: HomeCryptoUpDownCardModel = {
  kind: "crypto-up-down",
  title: "Bitcoin Up or Down - 10AM-11AM",
  href: "/event/lab-bitcoin-up-down",
  imageSrc: placeholderImage,
  metaLabels: ["Crypto", "Bitcoin"],
  assetLabel: "Bitcoin",
  volumeLabel: "$442K Vol.",
  liveLabel: "Live",
  price: 0.62,
  actions: [
    { label: "Up", price: 0.62 },
    { label: "Down", price: 0.38 },
  ],
};

const cryptoList: CryptoCardModel = {
  id: "lab-crypto-list",
  slug: "lab-crypto-list",
  title: "Ethereum Price Targets This Month",
  imageSrc: placeholderImage,
  family: "hit-price",
  timeBucket: "monthly",
  asset: "ethereum",
  showLiveDot: false,
  volumeLabel: "$1.2M Vol.",
  metaLabel: "Ethereum",
  variant: "list",
  sortVolume: 1_200_000,
  primarySnippet: {
    id: "lab-eth-4k",
    marketId: "lab-eth-4k-market",
    label: "Hit $4,000",
    tokenId: null,
    fallbackPrice: 0.31,
    bestBid: 0.3,
    bestAsk: 0.32,
    primaryOutcomeLabel: "Yes",
    secondaryOutcomeLabel: "No",
  },
  snippets: [
    {
      id: "lab-eth-4k",
      marketId: "lab-eth-4k-market",
      label: "Hit $4,000",
      tokenId: null,
      fallbackPrice: 0.31,
      bestBid: 0.3,
      bestAsk: 0.32,
      primaryOutcomeLabel: "Yes",
      secondaryOutcomeLabel: "No",
    },
    {
      id: "lab-eth-4500",
      marketId: "lab-eth-4500-market",
      label: "Hit $4,500",
      tokenId: null,
      fallbackPrice: 0.16,
      bestBid: 0.15,
      bestAsk: 0.17,
      primaryOutcomeLabel: "Yes",
      secondaryOutcomeLabel: "No",
    },
  ],
};

const sportsMatchup: HomeSportsLiveCardModel = {
  kind: "sports-live",
  title: "Hanwha Life Esports vs. Nongshim Red Force",
  href: "/event/lab-hanwha-vs-nongshim",
  imageSrc: placeholderImage,
  metaLabels: ["LoL"],
  volumeLabel: "$3M Vol.",
  statusLabel: "Live",
  statusDetail: "Game 2",
  competitors: [
    {
      key: "hanwha",
      name: "Hanwha Life Esports",
      shortName: "HLE",
      logo: placeholderImage,
      score: "0",
      tokenId: "hanwha-yes",
      price: 0.01,
    },
    {
      key: "nongshim",
      name: "Nongshim Red Force",
      shortName: "NS",
      logo: placeholderImage,
      score: "1",
      tokenId: "nongshim-yes",
      price: 1,
    },
  ],
};

export default function CardLabPage() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Internal Route</p>
        <h1 className={styles.title}>Card Lab</h1>
        <p className={styles.copy}>
          Fixed specimen page for identifying every card family in the repo. Each specimen has a stable
          name and source component so we can refer to the exact surface before editing it.
        </p>
      </header>

      <section className={styles.rules}>
        <h2 className={styles.rulesTitle}>Selection rules</h2>
        <ul className={styles.rulesList}>
          <li>
            `binary-group-card`: this is one shared family. Render it whenever the event exposes multiple preview
            rows or grouped markets, then theme/tweak it by domain instead of splitting it into separate card
            implementations.
          </li>
          <li>
            `binary-widget-card`: this is one shared family for single dominant markets. Render it whenever the
            event resolves to one primary probability with two large outcomes, then specialize slots like subtitle,
            live dot, footer meta, and outcome labels by domain.
          </li>
          <li>
            `crypto-up-down-widget` is a themed use of `binary-widget-card`, not a fundamentally separate
            architecture.
          </li>
          <li>
            `crypto-binary-group` is a themed use of `binary-group-card`; the key difference is crypto-specific
            header/footer details and lighter label typography.
          </li>
          <li>
            `sport-non-live-who-wins` is also a themed use of `binary-group-card`; FIFA winner boards and similar
            sports futures should not become a third grouped-card implementation.
          </li>
          <li>
            `sports-binary-widget` is a themed use of `binary-widget-card`; it needs sports-specific matchup art
            and labels, but it should not fork into a separate base component. This is the sports path for
            non-matchup yes/no markets like season props.
          </li>
          <li>
            `sports-matchup-card` is separate from the binary widget/group families. It is a compact matchup card
            with two team rows, no headline, team percentages, two team buttons, and a notes line with live/game/volume/league.
          </li>
          <li>
            `live dot` is not a card-family selector. Crypto and sports can both carry it as a state overlay when
            the API says the market is active/live enough to deserve the badge.
          </li>
        </ul>
      </section>

      <section className={styles.grid}>
        <Specimen
          name="binary-group-card · general theme"
          source="shared grouped rows: features/market-cards/components/GroupedOutcomeRows.tsx · mounted via features/events/components/EventCard.tsx"
          usage="General non-sports, non-crypto grouped card. This should own grouped ladders and winner-board style previews outside sports-specific surfaces."
          route="No clean top-level route confirmed yet; inspect here until it is wired intentionally."
        >
          <EventCard event={eventGrouped} />
        </Specimen>

        <Specimen
          name="binary-widget-card · crypto up/down theme"
          source="shared probability arc: features/market-cards/components/ProbabilityArc.tsx · mounted via features/home/components/HomeMarketCard.tsx"
          usage="Shared widget family with crypto-specific slots. This is the WIP half-arc crypto direction and now matches the route-level crypto single-card architecture too."
          route="/"
        >
          <HomeMarketCard model={homeCryptoUpDown} layoutVariant="compact" />
        </Specimen>

        <Specimen
          name="binary-group-card · sports who-wins theme"
          source="shared grouped rows: features/market-cards/components/GroupedOutcomeRows.tsx · mounted via features/events/components/EventCard.tsx"
          usage="Same grouped family as the general and crypto ladder cards, but with sports-specific copy and meta."
          route="Shows up in mixed feeds such as trending/home when sports futures are surfaced."
        >
          <EventCard event={eventGrouped} />
        </Specimen>

        <Specimen
          name="binary-widget-card · general theme"
          source="shared probability arc: features/market-cards/components/ProbabilityArc.tsx · mounted via features/home/components/HomeMarketCard.tsx and features/events/components/EventCard.tsx"
          usage="General single-market binary card with one dominant probability and two large actions."
          route="/"
        >
          <HomeMarketCard model={homeBinary} layoutVariant="compact" />
        </Specimen>

        <Specimen
          name="binary-widget-card · sports non-matchup theme"
          source="shared probability arc: features/market-cards/components/ProbabilityArc.tsx · mounted via features/home/components/HomeMarketCard.tsx"
          usage="Sports single-binary manifestation for non-matchup yes/no markets. It should render whenever the event is sports-tagged but does not have live matchup/game semantics."
          route="/ and /sports/[league]/props"
        >
          <HomeMarketCard model={sportsBinary} layoutVariant="compact" />
        </Specimen>

        <Specimen
          name="binary-group-card · crypto theme"
          source="shared grouped rows: features/market-cards/components/GroupedOutcomeRows.tsx · mounted via features/crypto/components/CryptoCard.tsx"
          usage="Same grouped family as the general and sports who-wins cards. The key remaining parity note is that the row labels should use calmer, non-bold Polymarket typography."
          route="/crypto"
        >
          <CryptoCard card={cryptoList} />
        </Specimen>

        <Specimen
          name="sports-matchup-card · live compact theme"
          source="current manifestation: features/home/components/HomeMarketCard.tsx (sports-live)"
          usage="Compact sports matchup card used in mixed feeds when the card suppresses the headline entirely and leads with team icons, optional scores, team names, percentages, two full-width team buttons, and a compact notes line."
          route="Shows up in mixed feeds such as trending/home when live or in-play sports matchups are surfaced."
        >
          <HomeMarketCard model={sportsMatchup} layoutVariant="compact" />
        </Specimen>
      </section>

      <section className={styles.notes}>
        <h2 className={styles.rulesTitle}>Notes</h2>
        <p className={styles.noteText}>
          The lab is now intentionally trimmed to the clarified core families and shows them as themed manifestations,
          not as separate architectures. Containers like the home hero, sports props surface, and futures dashboard are
          omitted because they are route compositions, not core market-card families.
        </p>
        <p className={styles.noteText}>
          Sports now has two single-card manifestations in the lab: the normal sports binary widget for non-matchup
          yes/no markets, and the sports matchup/live card for events with real team-vs-team game semantics.
        </p>
        <p className={styles.noteText}>
          Sports and crypto can both show a live dot. That badge should be derived from API state and layered onto
          the selected family, not used as a reason to choose a different family.
        </p>
        <p className={styles.noteText}>
          The old sports widget specimen has been removed from the lab because it was confusing the parity work. The
          real compact sports matchup card is the only sports card in the lab that should be used for this homepage/trending pattern.
        </p>
        <p className={styles.noteText}>
          The full-circle crypto single card is intentionally removed from the main lab taxonomy. It still exists in the
          product today, but architecturally it should be replaced by the shared widget family represented here by the
          crypto up/down specimen.
        </p>
      </section>
    </main>
  );
}
