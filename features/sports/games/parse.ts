import type { PriceHydrationSeed } from "@/features/realtime/Hydrator";

export type SportsGameTag = {
  id: string;
  slug: string;
  label: string;
};

export type SportsGameTeam = {
  name: string;
  abbreviation?: string;
  record?: string;
  logo?: string;
};

export type SportsGameMarket = {
  id: string;
  question: string;
  groupItemTitle?: string;
  sportsMarketType?: string;
  line: number | null;
  outcomes: string[];
  outcomePrices: number[];
  clobTokenIds: string[];
  lastTradePrice: number;
  bestBid: number;
  bestAsk: number;
  volumeNum: number;
  volume24hr: number;
  acceptingOrders: boolean;
  closed: boolean;
};

export type SportsGameEvent = {
  id: string;
  slug: string;
  title: string;
  startTime?: string;
  endDate?: string;
  volume: number;
  volume24hr: number;
  live: boolean;
  ended: boolean;
  period?: string;
  score?: string;
  eventWeek?: number;
  image?: string;
  icon?: string;
  tags: SportsGameTag[];
  teams: SportsGameTeam[];
  eventMetadata?: {
    league?: string;
    tournament?: string;
  };
  markets: SportsGameMarket[];
};

export type SportsLeague = {
  slug: string;
  label: string;
};

export type SportsLeagueChip = SportsLeague & {
  count: number;
  href: string;
  active?: boolean;
};

export type SportsRowCompetitor = {
  key: string;
  name: string;
  abbreviation: string;
  record?: string;
  logo?: string;
};

export type SportsbookMarketCell = {
  key: string;
  label: string;
  tokenId?: string;
  price: number;
  bestBid: number;
  bestAsk: number;
};

export type SportsbookRowModel = {
  id: string;
  slug: string;
  league: SportsLeague;
  statusLabel: string;
  statusDetail?: string;
  volumeLabel: string;
  eventVolume: number;
  competitors: SportsRowCompetitor[];
  moneyline: SportsbookMarketCell[];
  spread: SportsbookMarketCell[];
  total: SportsbookMarketCell[];
  sortTime: number;
  isLive: boolean;
  eventWeek?: number;
  sectionLabel: string;
};

export type SportsbookSectionModel = {
  id: string;
  title: string;
  meta?: string;
  href?: string;
  actionLabel?: string;
  rows: SportsbookRowModel[];
};

type SportsMoneylineSelection = {
  cells: SportsbookMarketCell[];
  competitorLabels: string[];
};

const GENERIC_LEAGUE_SLUGS = new Set([
  "sports",
  "games",
  "hide-from-new",
  "basketball",
  "soccer",
  "football",
  "baseball",
  "hockey",
  "tennis",
  "cricket",
  "esports",
]);

const LEAGUE_PRIORITY = [
  "nba",
  "ucl",
  "nhl",
  "ufc",
  "epl",
  "nfl",
  "mlb",
  "wta",
  "atp",
  "league-of-legends",
  "counter-strike-2",
  "dota-2",
] as const;

const LEAGUE_LABEL_OVERRIDES: Record<string, string> = {
  nba: "NBA",
  nhl: "NHL",
  nfl: "NFL",
  mlb: "MLB",
  ufc: "UFC",
  ucl: "UCL",
  epl: "EPL",
  wta: "WTA",
  atp: "ATP",
  "league-of-legends": "League of Legends",
  "counter-strike-2": "Counter-Strike 2",
  "dota-2": "Dota 2",
  "premier-league": "EPL",
  formula1: "F1",
};

const LIVE_SECTION_ROW_LIMIT = 4;

const TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

const DATE_SECTION_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

const normalizeSlug = (value: string): string =>
  value.trim().toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-|-$/g, "");

const normalizeLabel = (slug: string, label?: string): string => {
  const normalizedSlug = normalizeSlug(slug);
  const override = LEAGUE_LABEL_OVERRIDES[normalizedSlug];

  if (override) return override;
  if (label && label.length <= 4) return label.toUpperCase();
  if (label) return label;

  return normalizedSlug
    .split("-")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
};

const clampProbability = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
};

const formatLine = (value: number): string => {
  const formatted = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return formatted.replace(/\.0$/, "");
};

const formatSportsVolume = (value: number): string => {
  if (!Number.isFinite(value) || value <= 0) return "$0";

  const absolute = Math.abs(value);
  if (absolute >= 1_000_000) {
    const decimals = absolute >= 10_000_000 ? 1 : 2;
    return `$${(value / 1_000_000).toFixed(decimals).replace(/\.0$/, "")}M`;
  }

  if (absolute >= 1_000) {
    const decimals = absolute >= 100_000 ? 1 : 2;
    return `$${(value / 1_000).toFixed(decimals).replace(/\.0$/, "")}K`;
  }

  return `$${Math.round(value)}`;
};

const getSortTime = (event: SportsGameEvent): number => {
  const candidate = event.startTime ?? event.endDate;
  if (!candidate) return Number.MAX_SAFE_INTEGER;

  const parsed = Date.parse(candidate);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
};

const getDateSectionLabel = (event: SportsGameEvent): string => {
  const candidate = event.startTime ?? event.endDate;
  if (!candidate) return "Upcoming";

  const parsed = new Date(candidate);
  if (Number.isNaN(parsed.getTime())) return "Upcoming";

  return DATE_SECTION_FORMATTER.format(parsed);
};

const formatStatusLabel = (event: SportsGameEvent): string => {
  if (event.live) return "Live";
  if (event.ended) return "Final";

  const candidate = event.startTime ?? event.endDate;
  if (!candidate) return "Upcoming";

  const parsed = new Date(candidate);
  if (Number.isNaN(parsed.getTime())) return "Upcoming";

  return TIME_FORMATTER.format(parsed);
};

const formatStatusDetail = (event: SportsGameEvent): string | undefined => {
  if (event.live && event.period) return event.period;
  if (event.ended && event.score) return event.score;
  return undefined;
};

const getEventVolume = (event: SportsGameEvent): number =>
  event.volume24hr > 0 ? event.volume24hr : event.volume;

const getPreferredTag = (event: SportsGameEvent): SportsGameTag | undefined => {
  const candidates = event.tags.filter((tag) => !["sports", "games", "hide-from-new"].includes(normalizeSlug(tag.slug)));

  for (const slug of LEAGUE_PRIORITY) {
    const priorityTag = candidates.find((tag) => normalizeSlug(tag.slug) === slug);
    if (priorityTag) return priorityTag;
  }

  const specificTag = candidates.find(
    (tag) => !GENERIC_LEAGUE_SLUGS.has(normalizeSlug(tag.slug)),
  );

  return specificTag ?? candidates[0];
};

export const getEventLeague = (event: SportsGameEvent): SportsLeague => {
  const preferredTag = getPreferredTag(event);
  if (preferredTag) {
    const slug = normalizeSlug(preferredTag.slug);
    return {
      slug,
      label: normalizeLabel(slug, preferredTag.label),
    };
  }

  if (event.eventMetadata?.league) {
    const slug = normalizeSlug(event.eventMetadata.league);
    return {
      slug,
      label: normalizeLabel(slug, event.eventMetadata.league),
    };
  }

  return {
    slug: "sports",
    label: "Sports",
  };
};

export const isMoneylineMarket = (market: SportsGameMarket): boolean => {
  if (market.sportsMarketType === "moneyline") return true;
  return (
    market.outcomes.length >= 2 &&
    market.sportsMarketType === undefined &&
    !/over\/under|o\/u|total|spread|handicap/i.test(
      `${market.groupItemTitle ?? ""} ${market.question}`,
    )
  );
};

const isSpreadMarket = (market: SportsGameMarket): boolean =>
  market.sportsMarketType === "spreads" ||
  market.sportsMarketType === "map_handicap";

const isTotalMarket = (market: SportsGameMarket): boolean =>
  market.sportsMarketType === "totals";

const compareMarkets = (left: SportsGameMarket, right: SportsGameMarket): number =>
  Number(right.acceptingOrders && !right.closed) -
    Number(left.acceptingOrders && !left.closed) ||
  right.volume24hr - left.volume24hr ||
  right.volumeNum - left.volumeNum ||
  left.question.localeCompare(right.question) ||
  left.id.localeCompare(right.id);

export const pickMoneylineMarket = (
  event: SportsGameEvent,
): SportsGameMarket | undefined =>
  [...event.markets].filter(isMoneylineMarket).sort(compareMarkets)[0];

export const pickSpreadMarket = (
  event: SportsGameEvent,
): SportsGameMarket | undefined =>
  [...event.markets].filter(isSpreadMarket).sort(compareMarkets)[0];

export const pickTotalMarket = (
  event: SportsGameEvent,
): SportsGameMarket | undefined =>
  [...event.markets].filter(isTotalMarket).sort(compareMarkets)[0];

const getSeedPrice = (market: SportsGameMarket, outcomeIndex: number): number => {
  const direct = market.outcomePrices[outcomeIndex];
  if (Number.isFinite(direct)) return clampProbability(direct);

  if (outcomeIndex === 0) return clampProbability(market.lastTradePrice);
  if (outcomeIndex === 1) return clampProbability(1 - market.lastTradePrice);

  return 0;
};

const getFallbackAbbreviation = (name: string): string => {
  const tokens = name.split(/\s+/).filter(Boolean);
  if (tokens.length >= 2) {
    return tokens.map((token) => token[0]).join("").slice(0, 4).toUpperCase();
  }

  return name.slice(0, 4).toUpperCase();
};

const normalizeName = (value: string): string =>
  value.trim().toLowerCase().replaceAll(/[^a-z0-9]+/g, " ");

const isYesNoOutcomes = (outcomes: ReadonlyArray<string>): boolean =>
  outcomes.length === 2 &&
  outcomes.every((outcome) => {
    const normalized = normalizeName(outcome);
    return normalized === "yes" || normalized === "no";
  });

const isDrawMoneylineMarket = (market: SportsGameMarket): boolean =>
  /draw/i.test(`${market.groupItemTitle ?? ""} ${market.question}`);

const cleanCompetitorLabel = (value: string): string => {
  const withoutSuffix = value
    .replace(/\s+\([^)]*\)\s*$/u, "")
    .replace(/^Will\s+/iu, "")
    .replace(/\s+win on .+$/iu, "")
    .trim();

  return withoutSuffix;
};

const extractTitleCompetitors = (title: string): string[] => {
  const withoutSuffix = title.split(" - ")[0] ?? title;
  const withoutPrefix = withoutSuffix.includes(":")
    ? (withoutSuffix.split(":").at(-1) ?? withoutSuffix).trim()
    : withoutSuffix.trim();

  return withoutPrefix
    .split(/\s+vs\.?\s+/iu)
    .map((part) => cleanCompetitorLabel(part))
    .filter(Boolean)
    .slice(0, 2);
};

const extractMoneylineCompetitorLabel = (
  market: SportsGameMarket,
): string | undefined => {
  if (isDrawMoneylineMarket(market)) {
    return "Draw";
  }

  if (market.groupItemTitle) {
    return cleanCompetitorLabel(market.groupItemTitle);
  }

  const questionMatch = market.question.match(/^Will\s+(.+?)\s+win on /iu);
  if (questionMatch?.[1]) {
    return cleanCompetitorLabel(questionMatch[1]);
  }

  return undefined;
};

const findTeamForOutcome = (
  outcome: string,
  teams: ReadonlyArray<SportsGameTeam>,
): SportsGameTeam | undefined => {
  const normalizedOutcome = normalizeName(outcome);

  return teams.find((team) => {
    const normalizedTeam = normalizeName(team.name);
    return (
      normalizedTeam === normalizedOutcome ||
      normalizedOutcome.includes(normalizedTeam) ||
      normalizedTeam.includes(normalizedOutcome)
    );
  });
};

const getOutcomeShortLabel = (
  outcome: string,
  teams: ReadonlyArray<SportsGameTeam>,
): string => {
  if (/draw/i.test(outcome)) return "DRAW";

  const matchingTeam = findTeamForOutcome(outcome, teams);
  if (matchingTeam?.abbreviation) {
    return matchingTeam.abbreviation.toUpperCase();
  }

  return getFallbackAbbreviation(outcome);
};

const buildCompetitors = (
  event: SportsGameEvent,
  competitorLabels: ReadonlyArray<string>,
): SportsRowCompetitor[] => {
  if (event.teams.length >= 2) {
    return event.teams.slice(0, 2).map((team) => ({
      key: normalizeSlug(team.name),
      name: team.name,
      abbreviation: (team.abbreviation ?? getFallbackAbbreviation(team.name)).toUpperCase(),
      record: team.record,
      logo: team.logo,
    }));
  }

  const titleCompetitors = extractTitleCompetitors(event.title);
  const fallbackLabels =
    titleCompetitors.length >= 2 ? titleCompetitors : [...competitorLabels];

  return fallbackLabels.slice(0, 2).map((label) => ({
    key: normalizeSlug(label),
    name: label,
    abbreviation: getFallbackAbbreviation(label),
  }));
};

const buildMarketCell = (
  market: SportsGameMarket,
  outcomeIndex: number,
  label: string,
): SportsbookMarketCell => ({
  key: `${market.id}:${outcomeIndex}`,
  label,
  tokenId: market.clobTokenIds[outcomeIndex],
  price: getSeedPrice(market, outcomeIndex),
  bestBid: outcomeIndex === 0 ? market.bestBid : 0,
  bestAsk: outcomeIndex === 0 ? market.bestAsk : 0,
});

const buildMoneylineCells = (
  market: SportsGameMarket | undefined,
  teams: ReadonlyArray<SportsGameTeam>,
): SportsbookMarketCell[] => {
  if (!market) return [];

  return market.outcomes.map((outcome, outcomeIndex) =>
    buildMarketCell(market, outcomeIndex, getOutcomeShortLabel(outcome, teams)),
  );
};

const buildSplitMoneylineCells = (
  event: SportsGameEvent,
  markets: ReadonlyArray<SportsGameMarket>,
): SportsMoneylineSelection => {
  const orderedCompetitors =
    event.teams.length >= 2
      ? event.teams.slice(0, 2).map((team) => team.name)
      : extractTitleCompetitors(event.title);

  const usedMarketIds = new Set<string>();
  const cells: SportsbookMarketCell[] = [];
  const competitorLabels: string[] = [];

  for (const competitor of orderedCompetitors) {
    const normalizedCompetitor = normalizeName(competitor);
    const market = markets.find((candidate) => {
      if (usedMarketIds.has(candidate.id)) return false;
      if (isDrawMoneylineMarket(candidate)) return false;

      const label = extractMoneylineCompetitorLabel(candidate);
      if (!label) return false;

      const normalizedLabel = normalizeName(label);

      return (
        normalizedLabel === normalizedCompetitor ||
        normalizedLabel.includes(normalizedCompetitor) ||
        normalizedCompetitor.includes(normalizedLabel)
      );
    });

    if (!market) continue;

    usedMarketIds.add(market.id);
    competitorLabels.push(competitor);
    cells.push(
      buildMarketCell(market, 0, getOutcomeShortLabel(competitor, event.teams)),
    );
  }

  const drawMarket = markets.find(
    (candidate) =>
      !usedMarketIds.has(candidate.id) && isDrawMoneylineMarket(candidate),
  );

  if (drawMarket) {
    usedMarketIds.add(drawMarket.id);
    cells.splice(Math.min(1, cells.length), 0, buildMarketCell(drawMarket, 0, "DRAW"));
  }

  const remainingMarkets = markets.filter((market) => !usedMarketIds.has(market.id));
  for (const market of remainingMarkets) {
    const label = extractMoneylineCompetitorLabel(market);
    if (!label || /draw/i.test(label)) continue;

    competitorLabels.push(label);
    cells.push(buildMarketCell(market, 0, getOutcomeShortLabel(label, event.teams)));
  }

  return {
    cells,
    competitorLabels: competitorLabels.filter(Boolean),
  };
};

const buildMoneylineSelection = (
  event: SportsGameEvent,
): SportsMoneylineSelection => {
  const moneylineMarkets = [...event.markets]
    .filter(isMoneylineMarket)
    .sort(compareMarkets);

  const bundledMarket = moneylineMarkets.find(
    (market) => !isYesNoOutcomes(market.outcomes),
  );

  if (bundledMarket) {
    return {
      cells: buildMoneylineCells(bundledMarket, event.teams),
      competitorLabels: bundledMarket.outcomes.filter(
        (outcome) => !/draw/i.test(outcome),
      ),
    };
  }

  return buildSplitMoneylineCells(event, moneylineMarkets);
};

const buildSpreadCells = (
  market: SportsGameMarket | undefined,
  teams: ReadonlyArray<SportsGameTeam>,
): SportsbookMarketCell[] => {
  if (!market) return [];

  return market.outcomes.slice(0, 2).map((outcome, outcomeIndex) => {
    const line = market.line;
    const signedLine =
      line === null ? null : outcomeIndex === 0 ? line : -line;
    const prefix = signedLine !== null && signedLine > 0 ? "+" : "";

    return buildMarketCell(
      market,
      outcomeIndex,
      signedLine === null
        ? getOutcomeShortLabel(outcome, teams)
        : `${getOutcomeShortLabel(outcome, teams)}${prefix}${formatLine(signedLine)}`,
    );
  });
};

const buildTotalCells = (
  market: SportsGameMarket | undefined,
): SportsbookMarketCell[] => {
  if (!market) return [];

  return market.outcomes.slice(0, 2).map((outcome, outcomeIndex) => {
    const shortOutcome =
      /over/i.test(outcome) || outcomeIndex === 0 ? "O" : "U";

    return buildMarketCell(
      market,
      outcomeIndex,
      market.line === null
        ? shortOutcome
        : `${shortOutcome} ${formatLine(market.line)}`,
    );
  });
};

const compareRows = (left: SportsbookRowModel, right: SportsbookRowModel): number =>
  Number(right.isLive) - Number(left.isLive) ||
  left.sortTime - right.sortTime ||
  right.moneyline.length - left.moneyline.length ||
  left.slug.localeCompare(right.slug);

export const buildSportsGameRows = (
  events: ReadonlyArray<SportsGameEvent>,
): SportsbookRowModel[] =>
  events
    .map((event) => {
      const moneylineSelection = buildMoneylineSelection(event);
      const spreadMarket = pickSpreadMarket(event);
      const totalMarket = pickTotalMarket(event);
      const competitors = buildCompetitors(
        event,
        moneylineSelection.competitorLabels,
      );
      const league = getEventLeague(event);

      return {
        id: event.id,
        slug: event.slug,
        league,
        statusLabel: formatStatusLabel(event),
        statusDetail: formatStatusDetail(event),
        volumeLabel: `${formatSportsVolume(getEventVolume(event))} Vol.${
          event.eventMetadata?.tournament
            ? ` · ${event.eventMetadata.tournament}`
            : ""
        }`,
        eventVolume: getEventVolume(event),
        competitors,
        moneyline: moneylineSelection.cells,
        spread: buildSpreadCells(spreadMarket, event.teams),
        total: buildTotalCells(totalMarket),
        sortTime: getSortTime(event),
        isLive: event.live,
        eventWeek: event.eventWeek,
        sectionLabel: getDateSectionLabel(event),
      };
    })
    .sort(compareRows);

export const selectRowsByLeague = (
  rows: ReadonlyArray<SportsbookRowModel>,
  leagueSlug: string,
): SportsbookRowModel[] => {
  const normalizedLeague = normalizeSlug(leagueSlug);
  return rows.filter((row) => row.league.slug === normalizedLeague);
};

const sortLeagueEntries = (
  entries: ReadonlyArray<{
    league: SportsLeague;
    rows: SportsbookRowModel[];
  }>,
): {
  league: SportsLeague;
  rows: SportsbookRowModel[];
}[] =>
  [...entries].sort((left, right) => {
    const leftVolume = left.rows.reduce((sum, row) => sum + row.eventVolume, 0);
    const rightVolume = right.rows.reduce((sum, row) => sum + row.eventVolume, 0);

    return (
      Number(right.rows.some((row) => row.isLive)) -
        Number(left.rows.some((row) => row.isLive)) ||
      rightVolume - leftVolume ||
      right.rows.length - left.rows.length ||
      left.league.label.localeCompare(right.league.label)
    );
  });

export const buildSportsLeagueChips = (
  rows: ReadonlyArray<SportsbookRowModel>,
  activeLeagueSlug?: string,
): SportsLeagueChip[] => {
  const groups = new Map<
    string,
    {
      league: SportsLeague;
      rows: SportsbookRowModel[];
    }
  >();

  for (const row of rows) {
    const existing = groups.get(row.league.slug);
    if (existing) {
      existing.rows.push(row);
      continue;
    }

    groups.set(row.league.slug, {
      league: row.league,
      rows: [row],
    });
  }

  return sortLeagueEntries([...groups.values()]).map(({ league, rows: leagueRows }) => ({
    ...league,
    count: leagueRows.length,
    href: `/sports/${league.slug}/games`,
    active: activeLeagueSlug
      ? league.slug === normalizeSlug(activeLeagueSlug)
      : false,
  }));
};

export const buildLiveRouteSections = (
  rows: ReadonlyArray<SportsbookRowModel>,
  {
    rowLimit = LIVE_SECTION_ROW_LIMIT,
  }: {
    rowLimit?: number;
  } = {},
): SportsbookSectionModel[] => {
  const groups = new Map<
    string,
    {
      league: SportsLeague;
      rows: SportsbookRowModel[];
    }
  >();

  for (const row of rows) {
    const existing = groups.get(row.league.slug);
    if (existing) {
      existing.rows.push(row);
      continue;
    }

    groups.set(row.league.slug, {
      league: row.league,
      rows: [row],
    });
  }

  return sortLeagueEntries([...groups.values()]).map(({ league, rows: leagueRows }) => ({
    id: league.slug,
    title: league.label,
    meta: `${leagueRows.length} games`,
    href: `/sports/${league.slug}/games`,
    actionLabel: `${leagueRows.length} Game View`,
    rows: [...leagueRows].sort(compareRows).slice(0, rowLimit),
  }));
};

export const buildLeagueRouteSections = (
  rows: ReadonlyArray<SportsbookRowModel>,
): SportsbookSectionModel[] => {
  const groups = new Map<
    string,
    {
      label: string;
      rows: SportsbookRowModel[];
      week: number | undefined;
    }
  >();

  for (const row of rows) {
    const existing = groups.get(row.sectionLabel);
    if (existing) {
      existing.rows.push(row);
      existing.week ??= row.eventWeek;
      continue;
    }

    groups.set(row.sectionLabel, {
      label: row.sectionLabel,
      rows: [row],
      week: row.eventWeek,
    });
  }

  return [...groups.values()]
    .sort(
      (left, right) =>
        left.rows[0]!.sortTime - right.rows[0]!.sortTime ||
        left.label.localeCompare(right.label),
    )
    .map((group) => ({
      id: normalizeSlug(group.label),
      title: group.label,
      meta:
        group.week && Number.isFinite(group.week)
          ? `Week ${group.week}`
          : `${group.rows.length} games`,
      rows: [...group.rows].sort(compareRows),
    }));
};

export const buildSportsPreviewHydrationSeeds = (
  rows: ReadonlyArray<SportsbookRowModel>,
  {
    rowLimit,
  }: {
    rowLimit?: number;
  } = {},
): PriceHydrationSeed[] => {
  const seen = new Map<string, PriceHydrationSeed>();
  const sourceRows =
    typeof rowLimit === "number" && rowLimit > 0 ? rows.slice(0, rowLimit) : rows;

  for (const row of sourceRows) {
    for (const marketCell of [...row.moneyline, ...row.spread, ...row.total]) {
      if (!marketCell.tokenId) continue;
      if (seen.has(marketCell.tokenId)) continue;

      seen.set(marketCell.tokenId, {
        tokenId: marketCell.tokenId,
        price: marketCell.price,
        bestBid: marketCell.bestBid,
        bestAsk: marketCell.bestAsk,
      });
    }
  }

  return [...seen.values()];
};
