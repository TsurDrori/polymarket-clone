import { render, screen } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import type {
  PolymarketEvent,
  PolymarketMarket,
  PolymarketTag,
} from "@/features/events/types";
import { formatPct } from "@/shared/lib/format";
import { HomeMarketGrid } from "./HomeMarketGrid";
import { buildHomeEventCardEntries } from "./homeCardModel";

vi.mock("next/image", () => ({
  default: (
    props: ImgHTMLAttributes<HTMLImageElement> & {
      fill?: boolean;
      unoptimized?: boolean;
    },
  ) => {
    const imgProps = { ...props };
    delete imgProps.fill;
    delete imgProps.unoptimized;

    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={props.alt ?? ""} {...imgProps} />;
  },
}));

vi.mock("@/features/events/components/PriceCell", () => ({
  PriceCell: ({ fallbackValue }: { fallbackValue: number }) => formatPct(fallbackValue),
}));

vi.mock("@/features/realtime/surfaces/hooks", () => ({
  useProjectedSurfaceWindow: ({ items }: { items: unknown[] }) => ({
    visibleItems: items,
    leaderIds: [],
    highlightedIds: [],
    hasMore: false,
    showMore: vi.fn(),
  }),
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
  endDate: overrides.endDate ?? "2026-12-31T23:59:59.000Z",
  image: overrides.image,
  icon: overrides.icon,
  active: overrides.active ?? true,
  closed: overrides.closed ?? false,
  archived: overrides.archived ?? false,
  featured: overrides.featured ?? false,
  restricted: overrides.restricted ?? false,
  live: overrides.live,
  ended: overrides.ended,
  period: overrides.period,
  score: overrides.score,
  eventWeek: overrides.eventWeek,
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
  teams: overrides.teams,
  eventMetadata: overrides.eventMetadata,
});

describe("HomeMarketGrid", () => {
  it("renders binary cards with the headline chance and complementary yes/no actions", () => {
    const event = buildEvent(
      "Will OpenAI launch a consumer hardware product by...?",
      [
        { id: "1", slug: "tech", label: "Tech" },
        { id: "2", slug: "ai", label: "AI" },
      ],
      {
        markets: [
          buildMarket({
            outcomes: ["Yes", "No"],
            lastTradePrice: 0.34,
            outcomePrices: [0.34, 0.66],
            clobTokenIds: ["yes-token", "no-token"],
          }),
        ],
      },
    );

    render(<HomeMarketGrid items={buildHomeEventCardEntries([event])} />);

    expect(
      screen.getByRole("heading", { name: "Will OpenAI launch a consumer hardware product by...?" }),
    ).toBeTruthy();
    expect(screen.getAllByText("34%").length).toBeGreaterThan(0);
    expect(screen.getByText("Tech")).toBeTruthy();
    expect(screen.getByText("AI")).toBeTruthy();
    expect(screen.getAllByText("Yes").length).toBeGreaterThan(0);
    expect(screen.getAllByText("No").length).toBeGreaterThan(0);
    expect(screen.getByText("66%")).toBeTruthy();
  });

  it("keeps grouped preview rows in source order instead of re-sorting them by volume", () => {
    const event = buildEvent(
      "What will happen before GTA VI?",
      [{ id: "1", slug: "culture", label: "Culture" }],
      {
        showAllOutcomes: true,
        markets: [
          buildMarket({
            id: "first",
            groupItemTitle: "July 31",
            question: "July 31",
            lastTradePrice: 0.49,
            volumeNum: 1_000,
          }),
          buildMarket({
            id: "second",
            groupItemTitle: "June 30",
            question: "June 30",
            lastTradePrice: 0.31,
            volumeNum: 9_000,
          }),
          buildMarket({
            id: "third",
            groupItemTitle: "April 30",
            question: "April 30",
            lastTradePrice: 0.12,
            volumeNum: 20_000,
          }),
        ],
      },
    );

    render(<HomeMarketGrid items={buildHomeEventCardEntries([event])} />);

    const rowLabels = screen.getAllByText(/July 31|June 30/).map((node) => node.textContent);
    expect(rowLabels).toEqual(["July 31", "June 30"]);
  });
});
