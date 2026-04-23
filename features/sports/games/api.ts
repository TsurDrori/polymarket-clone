import { unstable_cache } from "next/cache";
import { GammaError } from "@/features/events/api/gamma";
import {
  isMoneylineMarket,
  pickSpreadMarket,
  pickTotalMarket,
  type SportsGameEvent,
  type SportsGameMarket,
} from "./parse";

const GAMMA_BASE = "https://gamma-api.polymarket.com";
const PAGE_LIMIT = 250;
const ALL_LEAGUE_TARGET_EVENTS = 750;
const ALL_LEAGUE_MAX_PAGES = 4;
const LEAGUE_MAX_PAGES = 4;
const TARGET_LEAGUE_ROWS = 8;
const SPORTS_LIVE_INITIAL_REVALIDATE_SECONDS = 30;
const HOME_SPORTS_PREVIEW_REVALIDATE_SECONDS = 30;

type RawTag = {
  id?: unknown;
  slug?: unknown;
  label?: unknown;
};

type RawTeam = {
  name?: unknown;
  abbreviation?: unknown;
  record?: unknown;
  logo?: unknown;
};

type RawEventMetadata = {
  league?: unknown;
  tournament?: unknown;
};

type RawMarket = {
  id?: unknown;
  question?: unknown;
  groupItemTitle?: unknown;
  sportsMarketType?: unknown;
  line?: unknown;
  outcomes?: unknown;
  outcomePrices?: unknown;
  clobTokenIds?: unknown;
  lastTradePrice?: unknown;
  bestBid?: unknown;
  bestAsk?: unknown;
  volume?: unknown;
  volume24hr?: unknown;
  acceptingOrders?: unknown;
  closed?: unknown;
};

type RawEvent = {
  id?: unknown;
  slug?: unknown;
  title?: unknown;
  startTime?: unknown;
  endDate?: unknown;
  volume?: unknown;
  volume24hr?: unknown;
  live?: unknown;
  ended?: unknown;
  period?: unknown;
  score?: unknown;
  eventWeek?: unknown;
  image?: unknown;
  icon?: unknown;
  tags?: unknown;
  teams?: unknown;
  eventMetadata?: unknown;
  markets?: unknown;
};

type SportsGameKeysetPayload = {
  events?: unknown;
  next_cursor?: unknown;
};

const isString = (value: unknown): value is string => typeof value === "string";

const toStringOrUndefined = (value: unknown): string | undefined =>
  isString(value) && value.length > 0 ? value : undefined;

const toNumber = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string" && value.length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const toBoolean = (value: unknown): boolean => value === true;

const parseStringArray = (value: unknown): string[] => {
  if (!isString(value)) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

const parseNumberArray = (value: unknown): number[] => {
  if (!isString(value)) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.map((entry) => Number(entry)).filter(Number.isFinite)
      : [];
  } catch {
    return [];
  }
};

const parseTag = (raw: RawTag) => ({
  id: String(raw.id ?? ""),
  slug: isString(raw.slug) ? raw.slug : "",
  label: isString(raw.label) ? raw.label : "",
});

const parseTeam = (raw: RawTeam) => ({
  name: isString(raw.name) ? raw.name : "",
  abbreviation: toStringOrUndefined(raw.abbreviation),
  record: toStringOrUndefined(raw.record),
  logo: toStringOrUndefined(raw.logo),
});

const parseEventMetadata = (
  raw: unknown,
): SportsGameEvent["eventMetadata"] | undefined => {
  if (!raw || typeof raw !== "object") return undefined;
  const metadata = raw as RawEventMetadata;
  return {
    league: toStringOrUndefined(metadata.league),
    tournament: toStringOrUndefined(metadata.tournament),
  };
};

const parseMarket = (raw: RawMarket): SportsGameEvent["markets"][number] => ({
  id: String(raw.id ?? ""),
  question: isString(raw.question) ? raw.question : "",
  groupItemTitle: toStringOrUndefined(raw.groupItemTitle),
  sportsMarketType: toStringOrUndefined(raw.sportsMarketType),
  line:
    raw.line === undefined || raw.line === null ? null : toNumber(raw.line),
  outcomes: parseStringArray(raw.outcomes),
  outcomePrices: parseNumberArray(raw.outcomePrices),
  clobTokenIds: parseStringArray(raw.clobTokenIds),
  lastTradePrice: toNumber(raw.lastTradePrice),
  bestBid: toNumber(raw.bestBid),
  bestAsk: toNumber(raw.bestAsk),
  volumeNum: toNumber(raw.volume),
  volume24hr: toNumber(raw.volume24hr),
  acceptingOrders: toBoolean(raw.acceptingOrders),
  closed: toBoolean(raw.closed),
});

const isValidRawEvent = (raw: unknown): raw is RawEvent => {
  if (!raw || typeof raw !== "object") return false;
  const event = raw as RawEvent;
  return (
    isString(event.slug) &&
    isString(event.title) &&
    Array.isArray(event.markets) &&
    event.markets.length > 0
  );
};

const parseEvent = (raw: RawEvent): SportsGameEvent => {
  const tags = Array.isArray(raw.tags) ? raw.tags.map((tag) => parseTag(tag as RawTag)) : [];
  const teams = Array.isArray(raw.teams)
    ? raw.teams.map((team) => parseTeam(team as RawTeam)).filter((team) => team.name)
    : [];
  const markets = Array.isArray(raw.markets)
    ? raw.markets
        .map((market) => parseMarket(market as RawMarket))
        .filter((market) => market.id && market.question && market.outcomes.length > 0)
    : [];

  return {
    id: String(raw.id ?? ""),
    slug: isString(raw.slug) ? raw.slug : "",
    title: isString(raw.title) ? raw.title : "",
    startTime: toStringOrUndefined(raw.startTime),
    endDate: toStringOrUndefined(raw.endDate),
    volume: toNumber(raw.volume),
    volume24hr: toNumber(raw.volume24hr),
    live: toBoolean(raw.live),
    ended: toBoolean(raw.ended),
    period: toStringOrUndefined(raw.period),
    score: toStringOrUndefined(raw.score),
    eventWeek:
      raw.eventWeek === undefined || raw.eventWeek === null
        ? undefined
        : toNumber(raw.eventWeek),
    image: toStringOrUndefined(raw.image),
    icon: toStringOrUndefined(raw.icon),
    tags,
    teams,
    eventMetadata: parseEventMetadata(raw.eventMetadata),
    markets,
  };
};

const isPseudoSportsGameEvent = (event: SportsGameEvent): boolean =>
  event.slug.endsWith("-more-markets") || event.title.endsWith(" - More Markets");

const parseSportsGameEvents = (payload: unknown): SportsGameEvent[] => {
  if (!Array.isArray(payload)) return [];
  const events: SportsGameEvent[] = [];

  for (const raw of payload) {
    if (!isValidRawEvent(raw)) continue;
    const event = parseEvent(raw);
    if (event.markets.length === 0) continue;
    if (isPseudoSportsGameEvent(event)) continue;
    events.push(event);
  }

  return events;
};

const buildKeysetUrl = (afterCursor?: string): string => {
  return buildPreviewKeysetUrl({ afterCursor, limit: PAGE_LIMIT });
};

const buildPreviewKeysetUrl = ({
  afterCursor,
  limit,
}: {
  afterCursor?: string;
  limit: number;
}): string => {
  const params = new URLSearchParams();
  params.set("active", "true");
  params.set("closed", "false");
  params.set("limit", String(limit));
  params.set("order", "volume24hr");
  params.set("ascending", "false");
  params.set("tag_slug", "games");
  if (afterCursor) {
    params.set("after_cursor", afterCursor);
  }

  return `${GAMMA_BASE}/events/keyset?${params.toString()}`;
};

export async function getHomeSportsGamePreviewEvents(
  limit = 40,
): Promise<SportsGameEvent[]> {
  return getCachedHomeSportsGamePreviewEvents(limit);
}

const trimHomePreviewMarket = (
  market: SportsGameMarket,
): SportsGameEvent["markets"][number] => ({
  id: market.id,
  question: market.question,
  groupItemTitle: market.groupItemTitle,
  sportsMarketType: market.sportsMarketType,
  line: market.line,
  outcomes: [...market.outcomes],
  outcomePrices: [...market.outcomePrices],
  clobTokenIds: [...market.clobTokenIds],
  lastTradePrice: market.lastTradePrice,
  bestBid: market.bestBid,
  bestAsk: market.bestAsk,
  volumeNum: market.volumeNum,
  volume24hr: market.volume24hr,
  acceptingOrders: market.acceptingOrders,
  closed: market.closed,
});

const appendUniquePreviewMarket = (
  target: SportsGameEvent["markets"],
  seen: Set<string>,
  market: SportsGameMarket | undefined,
): void => {
  if (!market || seen.has(market.id)) {
    return;
  }

  seen.add(market.id);
  target.push(trimHomePreviewMarket(market));
};

const trimHomePreviewEvent = (event: SportsGameEvent): SportsGameEvent => {
  const previewMarkets: SportsGameEvent["markets"] = [];
  const seenMarketIds = new Set<string>();

  for (const market of event.markets.filter(isMoneylineMarket)) {
    appendUniquePreviewMarket(previewMarkets, seenMarketIds, market);
  }

  // Preserve the current home chooser behavior by keeping representative
  // typed markets when present, even though the home card only renders the
  // moneyline path today.
  appendUniquePreviewMarket(
    previewMarkets,
    seenMarketIds,
    pickSpreadMarket(event),
  );
  appendUniquePreviewMarket(
    previewMarkets,
    seenMarketIds,
    pickTotalMarket(event),
  );

  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    startTime: event.startTime,
    endDate: event.endDate,
    volume: event.volume,
    volume24hr: event.volume24hr,
    live: event.live,
    ended: event.ended,
    period: event.period,
    score: event.score,
    eventWeek: event.eventWeek,
    image: event.image,
    icon: event.icon,
    tags: event.tags.map((tag) => ({
      id: tag.id,
      slug: tag.slug,
      label: tag.label,
    })),
    teams: event.teams.slice(0, 2).map((team) => ({
      name: team.name,
      abbreviation: team.abbreviation,
      record: team.record,
      logo: team.logo,
    })),
    eventMetadata: event.eventMetadata
      ? {
          league: event.eventMetadata.league,
          tournament: event.eventMetadata.tournament,
        }
      : undefined,
    markets: previewMarkets,
  };
};

const fetchHomeSportsGamePreviewEventsSource = async (
  limit: number,
): Promise<SportsGameEvent[]> => {
  const res = await fetch(buildPreviewKeysetUrl({ limit }), {
    // Cache the tiny derived preview instead of the oversized raw Gamma response.
    cache: "no-store",
  });

  if (!res.ok) {
    throw new GammaError(
      `getHomeSportsGamePreviewEvents failed: ${res.status} ${res.statusText}`,
      res.status,
    );
  }

  const payload = (await res.json()) as SportsGameKeysetPayload;

  return parseSportsGameEvents(payload.events).map(trimHomePreviewEvent);
};

const getCachedHomeSportsGamePreviewEvents = unstable_cache(
  async (limit: number): Promise<SportsGameEvent[]> =>
    fetchHomeSportsGamePreviewEventsSource(limit),
  ["home-sports-game-preview-events"],
  {
    revalidate: HOME_SPORTS_PREVIEW_REVALIDATE_SECONDS,
  },
);

const fetchSportsGamePage = async (
  afterCursor?: string,
  {
    revalidate,
  }: {
    revalidate?: number;
  } = {},
): Promise<{
  events: SportsGameEvent[];
  nextCursor: string | null;
}> => {
  const res = await fetch(
    buildKeysetUrl(afterCursor),
    typeof revalidate === "number"
      ? { next: { revalidate } }
      : {
          // The public games bundle is too large for Next's data cache, so
          // non-bounded catalogs still read it directly at request time.
          cache: "no-store",
        },
  );

  if (!res.ok) {
    throw new GammaError(
      `getSportsGamesWorkingSet failed: ${res.status} ${res.statusText}`,
      res.status,
    );
  }

  const payload = (await res.json()) as SportsGameKeysetPayload;

  return {
    events: parseSportsGameEvents(payload.events),
    nextCursor:
      payload.next_cursor === null || payload.next_cursor === undefined
        ? null
        : String(payload.next_cursor),
  };
};

const getCachedSportsLiveInitialPageEvents = unstable_cache(
  async (): Promise<{
    events: SportsGameEvent[];
    hasMorePages: boolean;
  }> => {
    const { events, nextCursor } = await fetchSportsGamePage();

    return {
      events,
      hasMorePages: Boolean(nextCursor),
    };
  },
  ["sports-live-initial-page-events"],
  {
    revalidate: SPORTS_LIVE_INITIAL_REVALIDATE_SECONDS,
  },
);

export async function getSportsLiveInitialPageEvents(): Promise<{
  events: SportsGameEvent[];
  hasMorePages: boolean;
}> {
  return getCachedSportsLiveInitialPageEvents();
}

const normalizeLeagueSlug = (value: string): string =>
  value.trim().toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-|-$/g, "");

const chooseLeagueSlug = (event: SportsGameEvent): string | null => {
  const candidates = event.tags
    .map((tag) => normalizeLeagueSlug(tag.slug))
    .filter(Boolean);

  const preferred = candidates.find(
    (slug) =>
      slug !== "sports" &&
      slug !== "games" &&
      slug !== "hide-from-new" &&
      slug !== "basketball" &&
      slug !== "soccer" &&
      slug !== "football" &&
      slug !== "baseball" &&
      slug !== "hockey" &&
      slug !== "tennis" &&
      slug !== "cricket" &&
      slug !== "esports",
  );

  if (preferred) return preferred;

  const fallback = candidates.find(
    (slug) => slug !== "sports" && slug !== "games" && slug !== "hide-from-new",
  );

  if (fallback) return fallback;

  return event.eventMetadata?.league
    ? normalizeLeagueSlug(event.eventMetadata.league)
    : null;
};

const countLeagueRows = (
  events: ReadonlyArray<SportsGameEvent>,
  desiredLeagueSlug: string,
): number => {
  const normalizedDesired = normalizeLeagueSlug(desiredLeagueSlug);
  return events.filter((event) => chooseLeagueSlug(event) === normalizedDesired).length;
};

export async function getSportsGamesWorkingSet({
  desiredLeagueSlug,
  revalidate,
  maxPages,
}: {
  desiredLeagueSlug?: string;
  revalidate?: number;
  maxPages?: number;
} = {}): Promise<SportsGameEvent[]> {
  const events: SportsGameEvent[] = [];
  const seen = new Set<string>();
  let cursor: string | undefined;
  let pageCount = 0;
  const maximumPages =
    typeof maxPages === "number" && maxPages > 0
      ? maxPages
      : desiredLeagueSlug
        ? LEAGUE_MAX_PAGES
        : ALL_LEAGUE_MAX_PAGES;

  while (pageCount < maximumPages) {
    const { events: pageEvents, nextCursor } = await fetchSportsGamePage(cursor, {
      revalidate,
    });
    pageCount += 1;

    for (const event of pageEvents) {
      if (seen.has(event.id)) continue;
      seen.add(event.id);
      events.push(event);
    }

    if (!nextCursor) break;

    if (desiredLeagueSlug) {
      if (countLeagueRows(events, desiredLeagueSlug) >= TARGET_LEAGUE_ROWS) {
        break;
      }
    } else if (events.length >= ALL_LEAGUE_TARGET_EVENTS) {
      break;
    }

    cursor = nextCursor;
  }

  return events;
}
