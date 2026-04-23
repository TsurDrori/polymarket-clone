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
  "league-of-legends": "LoL",
  "counter-strike-2": "Counter-Strike 2",
  "dota-2": "Dota 2",
  "fifa-world-cup": "FIFA World Cup",
  "premier-league": "EPL",
  formula1: "F1",
  "world-cup": "World Cup",
};

export const formatSportsLeagueLabel = (slug: string): string => {
  const normalizedSlug = slug
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "");

  const override = LEAGUE_LABEL_OVERRIDES[normalizedSlug];
  if (override) {
    return override;
  }

  return normalizedSlug
    .split("-")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
};
