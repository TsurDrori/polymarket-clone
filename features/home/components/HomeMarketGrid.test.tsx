import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  PolymarketEvent,
  PolymarketMarket,
  PolymarketTag,
} from "@/features/events/types";
import { formatPct } from "@/shared/lib/format";
import { HomeMarketGrid } from "./HomeMarketGrid";
import { buildHomeEventCardEntries } from "./homeCardModel";

const { useProjectedSurfaceWindow } = vi.hoisted(() => ({
  useProjectedSurfaceWindow: vi.fn(({ items }: { items: unknown[] }) => ({
    visibleItems: items,
    leaderIds: [],
    highlightedIds: [],
    hasMore: false,
    showMore: vi.fn(),
  })),
}));

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

vi.mock("@/features/market-cards/components/LivePriceDelta", () => ({
  LivePriceDelta: () => <span>LIVE-DELTA</span>,
}));

vi.mock("@/features/realtime/surfaces/hooks", () => ({
  useProjectedSurfaceWindow,
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
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    useProjectedSurfaceWindow.mockImplementation(({ items }: { items: unknown[] }) => ({
      visibleItems: items,
      leaderIds: [],
      highlightedIds: [],
      hasMore: false,
      showMore: vi.fn(),
    }));
  });

  it("auto-expands the next batch once a remote continuation append completes", () => {
    const events = Array.from({ length: 40 }, (_, index) =>
      buildEvent(
        `Market ${index + 1}`,
        [{ id: "1", slug: "politics", label: "Politics" }],
        { id: `event-${index + 1}` },
      ),
    );
    const cardEntries = buildHomeEventCardEntries(events);
    const showMore = vi.fn();
    const onContinue = vi.fn();

    useProjectedSurfaceWindow.mockImplementation(({ items }: { items: unknown[] }) =>
      items.length >= 40
        ? {
            visibleItems: items.slice(0, 20),
            leaderIds: [],
            highlightedIds: [],
            hasMore: true,
            showMore,
          }
        : {
            visibleItems: items.slice(0, 20),
            leaderIds: [],
            highlightedIds: [],
            hasMore: false,
            showMore,
          },
    );

    const { rerender } = render(
      <HomeMarketGrid
        items={cardEntries.slice(0, 20)}
        initialCount={20}
        incrementCount={20}
        continuation={{
          hasMore: true,
          onContinue,
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Show more markets" }));

    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(showMore).not.toHaveBeenCalled();

    rerender(
      <HomeMarketGrid
        items={cardEntries.slice(0, 20)}
        initialCount={20}
        incrementCount={20}
        continuation={{
          hasMore: true,
          disabled: true,
          onContinue,
        }}
      />,
    );

    expect(screen.getByRole("button", { name: "Loading markets…" })).toBeTruthy();

    rerender(
      <HomeMarketGrid
        items={cardEntries}
        initialCount={20}
        incrementCount={20}
        continuation={{
          hasMore: true,
          onContinue,
        }}
      />,
    );

    expect(showMore).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Show more markets" })).toBeTruthy();
  });

  it("keeps the loading label while the append request has finished but new cards have not committed yet", () => {
    const events = Array.from({ length: 40 }, (_, index) =>
      buildEvent(
        `Market ${index + 1}`,
        [{ id: "1", slug: "politics", label: "Politics" }],
        { id: `event-${index + 1}` },
      ),
    );
    const cardEntries = buildHomeEventCardEntries(events);
    const showMore = vi.fn();
    const onContinue = vi.fn();

    useProjectedSurfaceWindow.mockImplementation(({ items }: { items: unknown[] }) =>
      items.length >= 40
        ? {
            visibleItems: items.slice(0, 20),
            leaderIds: [],
            highlightedIds: [],
            hasMore: true,
            showMore,
          }
        : {
            visibleItems: items.slice(0, 20),
            leaderIds: [],
            highlightedIds: [],
            hasMore: false,
            showMore,
          },
    );

    const { rerender } = render(
      <HomeMarketGrid
        items={cardEntries.slice(0, 20)}
        initialCount={20}
        incrementCount={20}
        continuation={{
          hasMore: true,
          onContinue,
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Show more markets" }));

    rerender(
      <HomeMarketGrid
        items={cardEntries.slice(0, 20)}
        initialCount={20}
        incrementCount={20}
        continuation={{
          hasMore: true,
          disabled: true,
          onContinue,
        }}
      />,
    );

    rerender(
      <HomeMarketGrid
        items={cardEntries.slice(0, 20)}
        initialCount={20}
        incrementCount={20}
        continuation={{
          hasMore: true,
          onContinue,
        }}
      />,
    );

    expect(screen.getByRole("button", { name: "Loading markets…" })).toBeTruthy();
    expect(showMore).not.toHaveBeenCalled();

    rerender(
      <HomeMarketGrid
        items={cardEntries}
        initialCount={20}
        incrementCount={20}
        continuation={{
          hasMore: true,
          onContinue,
        }}
      />,
    );

    expect(showMore).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Show more markets" })).toBeTruthy();
  });

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
    expect(screen.getAllByText("Yes").length).toBeGreaterThan(0);
    expect(screen.getAllByText("No").length).toBeGreaterThan(0);
    expect(screen.getByText("$500K Vol.")).toBeTruthy();
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

  it("falls through to remote continuation once the local projection is exhausted", () => {
    const event = buildEvent(
      "Will the Fed cut rates by September?",
      [{ id: "1", slug: "politics", label: "Politics" }],
    );
    const onContinue = vi.fn();
    useProjectedSurfaceWindow.mockImplementation(({ items }: { items: unknown[] }) => ({
      visibleItems: items,
      leaderIds: [],
      highlightedIds: [],
      hasMore: false,
      showMore: vi.fn(),
    }));

    render(
      <HomeMarketGrid
        items={buildHomeEventCardEntries([event])}
        continuation={{
          hasMore: true,
          onContinue,
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Show more markets" }));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("renders sports cards as scoreboard rows with final status and team actions", () => {
    const event = buildEvent(
      "Timberwolves vs. Nuggets",
      [
        { id: "1", slug: "sports", label: "Sports" },
        { id: "2", slug: "nba", label: "NBA" },
      ],
      {
        ended: true,
        score: "119-114",
        eventMetadata: { league: "NBA" },
        teams: [
          { name: "Timberwolves", abbreviation: "MIN", record: "49-33" },
          { name: "Nuggets", abbreviation: "DEN", record: "54-28" },
        ],
        markets: [
          buildMarket({
            id: "min",
            question: "Timberwolves moneyline",
            sportsMarketType: "moneyline",
            outcomes: ["Timberwolves", "Nuggets"],
            clobTokenIds: ["min-token", "den-token"],
            lastTradePrice: 1,
            outcomePrices: [1, 0],
          }),
        ],
      },
    );

    render(<HomeMarketGrid items={buildHomeEventCardEntries([event])} />);

    expect(screen.getByText("Final")).toBeTruthy();
    expect(screen.getByText("$500K Vol.")).toBeTruthy();
    expect(screen.getByText("NBA")).toBeTruthy();
    expect(screen.getAllByText("Timberwolves").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Nuggets").length).toBeGreaterThan(0);
    expect(screen.getAllByText("100%").length).toBeGreaterThan(0);
    expect(screen.getAllByText("0%").length).toBeGreaterThan(0);
    expect(screen.getByText("119")).toBeTruthy();
    expect(screen.getByText("114")).toBeTruthy();
  });

  it("uses compact sports action labels and hides placeholder zero scores", () => {
    const event = buildEvent(
      "El Mokawloon El Arab SC vs. El Ittihad SC El Iskandary",
      [
        { id: "1", slug: "sports", label: "Sports" },
        { id: "2", slug: "egy-1", label: "EGY 1" },
      ],
      {
        live: true,
        period: "HT",
        score: "0-0",
        teams: [
          { name: "El Mokawloon El Arab SC", abbreviation: "EME" },
          { name: "El Ittihad SC El Iskandary", abbreviation: "EIS" },
        ],
        markets: [
          buildMarket({
            id: "egy-1-live",
            question: "El Mokawloon El Arab SC vs. El Ittihad SC El Iskandary",
            sportsMarketType: "moneyline",
            outcomes: ["El Mokawloon El Arab SC", "El Ittihad SC El Iskandary"],
            outcomePrices: [0.33, 0.67],
            lastTradePrice: 0.33,
          }),
        ],
      },
    );

    const { container } = render(<HomeMarketGrid items={buildHomeEventCardEntries([event])} />);

    expect(screen.getAllByText("EME").length).toBeGreaterThan(1);
    expect(screen.getAllByText("EIS").length).toBeGreaterThan(1);
    expect(container.textContent?.includes("0|")).toBe(false);
  });

  it("uses the live websocket delta slot on binary cards instead of the static daily change text", () => {
    const event = buildEvent(
      "Strait of Hormuz traffic returns to normal?",
      [{ id: "1", slug: "world", label: "World" }],
      {
        markets: [
          buildMarket({
            clobTokenIds: ["token-yes", "token-no"],
            lastTradePrice: 0.03,
            outcomePrices: [0.03, 0.97],
            oneDayPriceChange: -0.04,
          }),
        ],
      },
    );

    const [entry] = buildHomeEventCardEntries([event]);

    render(
      <HomeMarketGrid
        items={entry ? [entry] : []}
        initialCount={1}
        incrementCount={1}
        continuation={{ hasMore: false, onContinue: vi.fn() }}
      />,
    );

    expect(screen.getByText("LIVE-DELTA")).toBeTruthy();
    expect(screen.queryByText("-4%")).toBeNull();
  });
});
