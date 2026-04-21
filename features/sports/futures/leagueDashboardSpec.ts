export type SportsFuturesCardRole = "hero" | "compact-list" | "bar";

export type SportsFuturesLeagueDashboardSpec = {
  league: string;
  title: string;
  routeTitle: string;
  pills: ReadonlyArray<{
    slug: string;
    label: string;
  }>;
  cards: ReadonlyArray<{
    slug: string;
    title: string;
    role: SportsFuturesCardRole;
    maxVisibleOutcomes: number;
  }>;
};

export type SportsFuturesLeagueIdentity = {
  label: string;
  shortLabel: string;
  accentColor: string;
};

export type SportsFuturesGroupSectionSpec = {
  title: string;
  items: ReadonlyArray<{
    slug: string;
    label: string;
    countKey: string;
  }>;
};

export const SPORTS_FUTURES_GROUP_SECTIONS: ReadonlyArray<SportsFuturesGroupSectionSpec> = [];

export const SPORTS_FUTURES_FEATURED_LEAGUES = [
  { slug: "nba", label: "NBA", countKey: "nba" },
] as const;

export const SPORTS_FUTURES_LEAGUE_SPECS: Record<
  string,
  SportsFuturesLeagueDashboardSpec
> = {
  nba: {
    league: "nba",
    title: "NBA",
    routeTitle: "Sports Futures",
    pills: [{ slug: "nba", label: "NBA" }],
    cards: [
      {
        slug: "2026-nba-champion",
        title: "NBA Champion",
        role: "hero",
        maxVisibleOutcomes: 8,
      },
      {
        slug: "nba-mvp-694",
        title: "NBA MVP",
        role: "compact-list",
        maxVisibleOutcomes: 5,
      },
      {
        slug: "nba-rookie-of-the-year-873",
        title: "Rookie of the Year",
        role: "compact-list",
        maxVisibleOutcomes: 5,
      },
      {
        slug: "nba-cup-winner-164",
        title: "NBA Cup Winner",
        role: "compact-list",
        maxVisibleOutcomes: 5,
      },
      {
        slug: "nba-eastern-conference-champion-442",
        title: "Eastern Conference Champion",
        role: "bar",
        maxVisibleOutcomes: 5,
      },
      {
        slug: "nba-western-conference-champion-933",
        title: "Western Conference Champion",
        role: "bar",
        maxVisibleOutcomes: 5,
      },
    ],
  },
};

export const NBA_TEAM_IDENTITIES: Record<string, SportsFuturesLeagueIdentity> = {
  "Oklahoma City Thunder": {
    label: "Oklahoma City Thunder",
    shortLabel: "OKC",
    accentColor: "#1f9ef6",
  },
  "San Antonio Spurs": {
    label: "San Antonio Spurs",
    shortLabel: "SAS",
    accentColor: "#8f9aa5",
  },
  "Boston Celtics": {
    label: "Boston Celtics",
    shortLabel: "BOS",
    accentColor: "#20b15a",
  },
  "Denver Nuggets": {
    label: "Denver Nuggets",
    shortLabel: "DEN",
    accentColor: "#dba11d",
  },
  "Cleveland Cavaliers": {
    label: "Cleveland Cavaliers",
    shortLabel: "CLE",
    accentColor: "#e65797",
  },
  "Detroit Pistons": {
    label: "Detroit Pistons",
    shortLabel: "DET",
    accentColor: "#ef7b21",
  },
  "New York Knicks": {
    label: "New York Knicks",
    shortLabel: "NYK",
    accentColor: "#f39b1e",
  },
  "Los Angeles Lakers": {
    label: "Los Angeles Lakers",
    shortLabel: "LAL",
    accentColor: "#7c56dd",
  },
  "Houston Rockets": {
    label: "Houston Rockets",
    shortLabel: "HOU",
    accentColor: "#ff4d8b",
  },
  "Golden State Warriors": {
    label: "Golden State Warriors",
    shortLabel: "GSW",
    accentColor: "#ffb61b",
  },
  "Cooper Flagg": {
    label: "Cooper Flagg",
    shortLabel: "CF",
    accentColor: "#1f9ef6",
  },
  "Viktor Wembanyama": {
    label: "Viktor Wembanyama",
    shortLabel: "VW",
    accentColor: "#8f9aa5",
  },
  "Nikola Jokic": {
    label: "Nikola Jokic",
    shortLabel: "NJ",
    accentColor: "#dba11d",
  },
  "Trae Young": {
    label: "Trae Young",
    shortLabel: "TY",
    accentColor: "#ef7b21",
  },
  "Kawhi Leonard": {
    label: "Kawhi Leonard",
    shortLabel: "KL",
    accentColor: "#7c56dd",
  },
  "Kon Knueppel": {
    label: "Kon Knueppel",
    shortLabel: "KK",
    accentColor: "#8f9aa5",
  },
  "V.J. Edgecombe": {
    label: "V.J. Edgecombe",
    shortLabel: "VJ",
    accentColor: "#e65797",
  },
  "Dylan Harper": {
    label: "Dylan Harper",
    shortLabel: "DH",
    accentColor: "#dba11d",
  },
  "Tre Johnson": {
    label: "Tre Johnson",
    shortLabel: "TJ",
    accentColor: "#ef7b21",
  },
  "New York Knicks 2026": {
    label: "New York Knicks",
    shortLabel: "NYK",
    accentColor: "#1f9ef6",
  },
  "Atlanta Hawks": {
    label: "Atlanta Hawks",
    shortLabel: "ATL",
    accentColor: "#8f9aa5",
  },
  "Brooklyn Nets": {
    label: "Brooklyn Nets",
    shortLabel: "BKN",
    accentColor: "#dba11d",
  },
  "Charlotte Hornets": {
    label: "Charlotte Hornets",
    shortLabel: "CHA",
    accentColor: "#ef7b21",
  },
  "Orlando Magic": {
    label: "Orlando Magic",
    shortLabel: "ORL",
    accentColor: "#1f9ef6",
  },
};

export const getSportsFuturesLeagueSpec = (
  league: string,
): SportsFuturesLeagueDashboardSpec | null =>
  SPORTS_FUTURES_LEAGUE_SPECS[league.toLowerCase()] ?? null;

export const getNBAIdentity = (label: string): SportsFuturesLeagueIdentity => {
  const exact = NBA_TEAM_IDENTITIES[label];
  if (exact) return exact;

  const trimmed = label.trim();
  return {
    label: trimmed,
    shortLabel: trimmed
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 3)
      .toUpperCase(),
    accentColor: "#8392a3",
  };
};
