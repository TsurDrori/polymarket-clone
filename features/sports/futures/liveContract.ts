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

type SportsPopularCounts = Record<string, number>;

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

const fetchRouteHtml = cache(async (routePath: string): Promise<string> => {
  const response = await fetch(`${POLYMARKET_BASE_URL}${routePath}`, {
    next: { revalidate: LIVE_ROUTE_REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch live sports futures route: ${routePath}`);
  }

  return response.text();
});

export const formatCompactCount = (value: number): string => {
  if (!Number.isFinite(value) || value <= 0) return "0";
  if (value >= 1000) {
    const abbreviated = value / 1000;
    const digits = abbreviated >= 10 ? 0 : 1;
    return `${abbreviated.toFixed(digits).replace(/\.0$/, "")}K`;
  }

  return String(Math.round(value));
};

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
