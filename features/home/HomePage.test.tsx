import { fireEvent, render, screen } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import type {
  PolymarketEvent,
  PolymarketMarket,
  PolymarketTag,
} from "@/features/events/types";
import { HomePage } from "./HomePage";
import type { HomePageModel } from "./selectors";

vi.mock("next/image", () => ({
  default: (
    props: ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    unoptimized?: boolean;
  }) => {
    const imgProps = { ...props };
    delete imgProps.fill;
    delete imgProps.unoptimized;

    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={props.alt ?? ""} {...imgProps} />;
  },
}));

vi.mock("./components/HomeHero", () => ({
  HomeHero: () => null,
}));

vi.mock("./components/CompactHeroDiscovery", () => ({
  CompactHeroDiscovery: () => null,
}));

const buildMarket = (
  overrides: Partial<PolymarketMarket> = {},
): PolymarketMarket => ({
  id: overrides.id ?? crypto.randomUUID(),
  question: overrides.question ?? "Will this happen?",
  conditionId: overrides.conditionId ?? crypto.randomUUID(),
  slug: overrides.slug ?? "will-this-happen",
  groupItemTitle: overrides.groupItemTitle,
  image: overrides.image,
  icon: overrides.icon,
  endDate: overrides.endDate,
  sportsMarketType: overrides.sportsMarketType,
  line: overrides.line ?? null,
  outcomes: overrides.outcomes ?? ["Yes", "No"],
  outcomePrices: overrides.outcomePrices ?? [0.65, 0.35],
  clobTokenIds: overrides.clobTokenIds ?? ["yes-token", "no-token"],
  volumeNum: overrides.volumeNum ?? 10_000,
  liquidityNum: overrides.liquidityNum ?? 5_000,
  lastTradePrice: overrides.lastTradePrice ?? 0.65,
  bestBid: overrides.bestBid ?? 0.64,
  bestAsk: overrides.bestAsk ?? 0.66,
  volume24hr: overrides.volume24hr ?? 2_000,
  oneDayPriceChange: overrides.oneDayPriceChange ?? 0.08,
  spread: overrides.spread ?? 0.02,
  acceptingOrders: overrides.acceptingOrders ?? true,
  closed: overrides.closed ?? false,
});

const buildEvent = (
  title: string,
  tags: PolymarketTag[],
  overrides: Partial<PolymarketEvent> = {},
): PolymarketEvent => ({
  id: overrides.id ?? crypto.randomUUID(),
  ticker: overrides.ticker ?? title,
  slug: overrides.slug ?? title.toLowerCase().replaceAll(/\s+/g, "-"),
  title,
  description: overrides.description,
  startDate: overrides.startDate,
  creationDate: overrides.creationDate,
  endDate: overrides.endDate,
  image: overrides.image,
  icon: overrides.icon,
  active: overrides.active ?? true,
  closed: overrides.closed ?? false,
  archived: overrides.archived ?? false,
  featured: overrides.featured ?? false,
  restricted: overrides.restricted ?? false,
  liquidity: overrides.liquidity ?? 1_000_000,
  volume: overrides.volume ?? 2_000_000,
  volume24hr: overrides.volume24hr ?? 500_000,
  volume1wk: overrides.volume1wk,
  volume1mo: overrides.volume1mo,
  volume1yr: overrides.volume1yr,
  openInterest: overrides.openInterest,
  negRisk: overrides.negRisk ?? false,
  commentCount: overrides.commentCount,
  showAllOutcomes: overrides.showAllOutcomes ?? false,
  showMarketImages: overrides.showMarketImages ?? false,
  markets: overrides.markets ?? [buildMarket()],
  tags,
  eventMetadata: overrides.eventMetadata,
});

describe("HomePage", () => {
  it("filters the homepage market grid in place when a chip is selected", () => {
    const politicsEvent = buildEvent(
      "Politics market",
      [{ id: "politics", slug: "politics", label: "Politics" }],
      { id: "politics-event" },
    );
    const cryptoEvent = buildEvent(
      "Crypto market",
      [{ id: "crypto", slug: "crypto", label: "Crypto" }],
      { id: "crypto-event" },
    );

    const model: HomePageModel = {
      hero: {
        spotlight: null,
        spotlights: [],
        pulse: [],
        topics: [],
        contextChips: [],
      },
      marketChips: [
        { slug: "all", label: "All" },
        { slug: "politics", label: "Politics" },
        { slug: "crypto", label: "Crypto" },
      ],
      exploreEvents: [politicsEvent, cryptoEvent],
    };

    render(<HomePage model={model} />);

    expect(screen.getByRole("heading", { name: "Politics market" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Crypto market" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Politics" }));

    expect(screen.getByRole("button", { name: "Politics" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(screen.getByRole("heading", { name: "Politics market" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Crypto market" })).toBeNull();
  });
});
