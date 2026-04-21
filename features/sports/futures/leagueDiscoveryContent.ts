export type SportsFuturesLeagueDiscoveryColumn = {
  title: string;
  links: ReadonlyArray<{
    label: string;
    href: string;
    sublabel?: string;
  }>;
};

export type SportsFuturesLeagueDiscoveryContent = {
  relatedTopics: SportsFuturesLeagueDiscoveryColumn;
  popularMarkets: SportsFuturesLeagueDiscoveryColumn;
  newMarkets: SportsFuturesLeagueDiscoveryColumn;
};

export const NBA_LEAGUE_DISCOVERY_CONTENT: SportsFuturesLeagueDiscoveryContent = {
  relatedTopics: {
    title: "Related topics",
    links: [
      { label: "Games", href: "/sports/live", sublabel: "Predictions & odds" },
      { label: "Soccer", href: "/sports/futures/soccer", sublabel: "Predictions & odds" },
      { label: "Basketball", href: "/sports/futures/nba", sublabel: "Predictions & odds" },
      { label: "Tennis", href: "/sports/futures/tennis", sublabel: "Predictions & odds" },
      { label: "Baseball", href: "/sports/futures/mlb", sublabel: "Predictions & odds" },
      { label: "Hockey", href: "/sports/futures/nhl", sublabel: "Predictions & odds" },
      { label: "NFL", href: "/sports/futures/nfl", sublabel: "Predictions & odds" },
      {
        label: "UEFA Champions League",
        href: "/sports/futures/ucl",
        sublabel: "Predictions & odds",
      },
      { label: "Cricket", href: "/sports/futures/cricket", sublabel: "Predictions & odds" },
    ],
  },
  popularMarkets: {
    title: "Popular NBA markets",
    links: [
      { label: "NBA Sixth Man of the Year Winner", href: "/event/nba-sixth-man-of-the-year-2026" },
      { label: "NBA Coach of the Year Winner", href: "/event/nba-coach-of-the-year-2026" },
      { label: "NBA Playoffs: Who Will Win Series? Pistons vs. Magic", href: "/event/nba-playoffs-pistons-vs-magic-series-winner" },
      { label: "NBA Playoffs: Who Will Win Series? Timberwolves vs. Lakers", href: "/event/nba-playoffs-timberwolves-vs-lakers-series-winner" },
      { label: "NBA Most Improved Player Winner", href: "/event/nba-most-improved-player-2026" },
      { label: "NBA Playoffs: Team to advance to Conference Semifinals", href: "/event/nba-playoffs-conference-semifinals-2026" },
      { label: "NBA Playoffs: Who Will Win Series? Knicks vs. Pistons", href: "/event/nba-playoffs-knicks-vs-pistons-series-winner" },
      { label: "NBA Playoffs: Who Will Win Series? Spurs vs. Trail Blazers", href: "/event/nba-playoffs-spurs-vs-trail-blazers-series-winner" },
    ],
  },
  newMarkets: {
    title: "New NBA markets",
    links: [
      { label: "Which team will Steve Kerr join next by the end of 2026?", href: "/event/which-team-will-steve-kerr-join-next" },
      { label: "NBA: Sun Award? Who Wins?", href: "/event/nba-sun-award-2026" },
      { label: "NBA Playoffs: Who Will Win Series? Spurs vs. Trail Blazers", href: "/event/nba-playoffs-spurs-vs-trail-blazers-series-winner" },
      { label: "NBA Playoffs: Who Will Win Series? Suns vs. Thunder", href: "/event/nba-playoffs-suns-vs-thunder-series-winner" },
      { label: "NBA Playoffs: Suns vs. Thunder Total Games O/U 4.5", href: "/event/nba-playoffs-suns-vs-thunder-total-games" },
      { label: "NBA Playoffs: Who Will Win Series? Pistons vs. Magic", href: "/event/nba-playoffs-pistons-vs-magic-series-winner" },
      { label: "NBA Playoffs: Who Will Win Series? Rockets vs. Nuggets", href: "/event/nba-playoffs-rockets-vs-nuggets-series-winner" },
      { label: "NBA Playoffs: Timberwolves vs. Nuggets", href: "/event/nba-playoffs-timberwolves-vs-nuggets" },
    ],
  },
};
