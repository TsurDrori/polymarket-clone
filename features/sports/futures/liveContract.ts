import { cache } from "react";

const POLYMARKET_BASE_URL = "https://polymarket.com";
const LIVE_ROUTE_REVALIDATE_SECONDS = 15 * 60;

type NextDataQuery = {
  queryKey?: unknown;
  state?: {
    data?: unknown;
  };
};

type NextDataPayload = {
  props?: {
    pageProps?: {
      dehydratedState?: {
        queries?: NextDataQuery[];
      };
    };
  };
};

type AggregateRailSourceTag = {
  slug: string;
  label: string;
  activeEventsCount: number;
};

export type SportsFuturesAggregateRailItem = {
  slug: string;
  label: string;
  count: number;
  href: string;
};

type SportsPopularCounts = Record<string, number>;

const AGGREGATE_RAIL_ORDER = [
  "nfl",
  "soccer",
  "epl",
  "mlb",
  "champions-league",
  "europa-league",
  "cfb",
  "formula1",
  "wnba",
  "esports",
  "fantasy-football",
  "golf",
  "ufc",
  "boxing",
  "chess",
  "tennis",
  "games",
  "nba",
  "nhl",
] as const;

const AGGREGATE_RAIL_FALLBACK: ReadonlyArray<SportsFuturesAggregateRailItem> = [
  { slug: "nfl", label: "NFL", count: 83, href: "/sports/futures/nfl" },
  { slug: "soccer", label: "Soccer", count: 3427, href: "/sports/futures/soccer" },
  { slug: "epl", label: "EPL", count: 101, href: "/sports/futures/epl" },
  { slug: "mlb", label: "MLB", count: 122, href: "/sports/futures/mlb" },
  {
    slug: "champions-league",
    label: "Champions League",
    count: 12,
    href: "/sports/futures/champions-league",
  },
  {
    slug: "europa-league",
    label: "Europa League",
    count: 13,
    href: "/sports/futures/europa-league",
  },
  { slug: "cfb", label: "CFB", count: 5, href: "/sports/futures/cfb" },
  { slug: "formula1", label: "Formula 1", count: 4, href: "/sports/futures/formula1" },
  { slug: "wnba", label: "WNBA", count: 2, href: "/sports/futures/wnba" },
  { slug: "esports", label: "Esports", count: 544, href: "/sports/futures/esports" },
  {
    slug: "fantasy-football",
    label: "Fantasy Football",
    count: 1,
    href: "/sports/futures/fantasy-football",
  },
  { slug: "golf", label: "Golf", count: 5, href: "/sports/futures/golf" },
  { slug: "ufc", label: "UFC", count: 61, href: "/sports/futures/ufc" },
  { slug: "boxing", label: "Boxing", count: 3, href: "/sports/futures/boxing" },
  { slug: "chess", label: "Chess", count: 1, href: "/sports/futures/chess" },
  { slug: "tennis", label: "Tennis", count: 164, href: "/sports/futures/tennis" },
  { slug: "games", label: "Games", count: 4533, href: "/sports/futures/games" },
  { slug: "nba", label: "NBA", count: 62, href: "/sports/futures/nba" },
  { slug: "nhl", label: "NHL", count: 53, href: "/sports/futures/nhl" },
] as const;

const POPULAR_COUNT_FALLBACK: SportsPopularCounts = {
  nba: 22,
  ucl: 8,
  nhl: 22,
  ufc: 37,
  nfl: 1,
  "nfl-draft": 1,
  cfb: 1,
  epl: 83,
  atp: 101,
  wta: 48,
  mlb: 91,
  golf: 1,
  f1: 1,
  boxing: 1,
  pickleball: 1,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isAggregateRailTag = (value: unknown): value is AggregateRailSourceTag =>
  isRecord(value) &&
  typeof value.slug === "string" &&
  typeof value.label === "string" &&
  typeof value.activeEventsCount === "number";

const readNextDataQueries = (payload: unknown): ReadonlyArray<NextDataQuery> => {
  const queries = (payload as NextDataPayload | undefined)?.props?.pageProps?.dehydratedState?.queries;
  return Array.isArray(queries) ? queries : [];
};

const getQueryData = (queries: ReadonlyArray<NextDataQuery>, queryKey: readonly unknown[]) => {
  const target = JSON.stringify(queryKey);

  for (const query of queries) {
    if (JSON.stringify(query.queryKey ?? null) === target) {
      return query.state?.data;
    }
  }

  return undefined;
};

const extractNextDataPayload = (html: string): NextDataPayload | null => {
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  );

  if (!match?.[1]) {
    return null;
  }

  try {
    return JSON.parse(match[1]) as NextDataPayload;
  } catch {
    return null;
  }
};

const extractAggregateAllCountLabel = (html: string): string | null => {
  const match = html.match(/All\s+([0-9]+(?:\.[0-9]+)?K)/i);
  return match?.[1] ?? null;
};

const fetchRouteHtml = cache(async (routePath: string): Promise<string> => {
  const response = await fetch(`${POLYMARKET_BASE_URL}${routePath}`, {
    next: { revalidate: LIVE_ROUTE_REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch live sports futures route: ${routePath}`);
  }

  return response.text();
});

const buildAggregateRailItems = (
  tags: ReadonlyArray<AggregateRailSourceTag>,
): SportsFuturesAggregateRailItem[] => {
  const bySlug = new Map(tags.map((tag) => [tag.slug, tag]));

  return AGGREGATE_RAIL_ORDER.flatMap((slug) => {
    const tag = bySlug.get(slug);
    if (!tag) return [];

    return [
      {
        slug: tag.slug,
        label: tag.label,
        count: tag.activeEventsCount,
        href: `/sports/futures/${tag.slug}`,
      },
    ];
  });
};

export const formatCompactCount = (value: number): string => {
  if (!Number.isFinite(value) || value <= 0) return "0";
  if (value >= 1000) {
    const abbreviated = value / 1000;
    const digits = abbreviated >= 10 ? 0 : 1;
    return `${abbreviated.toFixed(digits).replace(/\.0$/, "")}K`;
  }

  return String(Math.round(value));
};

export const getSportsFuturesAggregateRail = cache(
  async (): Promise<{
    allCountLabel: string;
    items: ReadonlyArray<SportsFuturesAggregateRailItem>;
  }> => {
    try {
      const html = await fetchRouteHtml("/sports/futures");
      const payload = extractNextDataPayload(html);
      const queries = readNextDataQueries(payload);
      const rawTags = getQueryData(queries, [
        "/api/tags",
        "filteredTagsBySlug",
        "sports",
        "active",
        "en",
      ]);

      const items = Array.isArray(rawTags)
        ? buildAggregateRailItems(rawTags.filter(isAggregateRailTag))
        : [];

      if (items.length > 0) {
        return {
          allCountLabel: extractAggregateAllCountLabel(html) ?? "9.2K",
          items,
        };
      }
    } catch {
      // Fall back to a recent live snapshot so the clone stays buildable.
    }

    return {
      allCountLabel: "9.2K",
      items: AGGREGATE_RAIL_FALLBACK,
    };
  },
);

export const getSportsFuturesPopularCounts = cache(
  async (): Promise<SportsPopularCounts> => {
    try {
      const html = await fetchRouteHtml("/sports/futures/nba");
      const payload = extractNextDataPayload(html);
      const queries = readNextDataQueries(payload);
      const rawCounts = getQueryData(queries, ["sportsPopularCounts"]);

      if (isRecord(rawCounts)) {
        return Object.fromEntries(
          Object.entries(rawCounts).filter((entry): entry is [string, number] =>
            typeof entry[0] === "string" && typeof entry[1] === "number",
          ),
        );
      }
    } catch {
      // Fall back to a recent live snapshot so the league sidebar stays deterministic.
    }

    return POPULAR_COUNT_FALLBACK;
  },
);
