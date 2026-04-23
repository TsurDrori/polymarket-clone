import type { SportsLeagueChip } from "@/features/sports/games/parse";

type SportsRailTone = {
  bg: string;
  fg: string;
};

export type SportsRailLeaf = {
  kind: "leaf";
  slug: string;
  label: string;
  href: string;
  count?: number;
  active: boolean;
  mark: string;
  tone: SportsRailTone;
};

export type SportsRailGroup = {
  kind: "group";
  slug: string;
  label: string;
  mark: string;
  tone: SportsRailTone;
  active: boolean;
  children: SportsRailLeaf[];
};

export type SportsDesktopRailModel = {
  topLeafs: ReadonlyArray<SportsRailLeaf>;
  groups: ReadonlyArray<SportsRailGroup>;
  trailingLeafs: ReadonlyArray<SportsRailLeaf>;
};

const FEATURED_LEAF_ORDER = ["nba", "ucl", "nhl", "ufc"] as const;

const TRAILING_LEAF_ORDER = ["golf", "formula1", "boxing"] as const;

const GROUP_ORDER = [
  {
    slug: "football",
    label: "Football",
    children: ["nfl", "nfl-draft", "cfb"],
  },
  {
    slug: "soccer",
    label: "Soccer",
    children: [
      "la-liga",
      "epl",
      "ucl",
      "bundesliga",
      "super-lig",
      "mls",
      "ligue-1",
      "copa-sudamericana",
      "copa-libertadores",
      "efl-championship",
      "denmark-superliga",
      "colombia-primera-a",
      "brazil-serie-b",
      "serie-a",
      "saudi-professional-league",
      "peru-liga-1",
      "j2-league",
      "eredivisie",
      "japan-j-league",
      "a-league-soccer",
      "dfb-pokal",
      "brazil-serie-a",
      "primeira-liga",
      "fifa-world-cup",
      "la-liga-2",
      "norway-eliteserien",
      "ligue-2",
      "serie-b",
      "czechia-fortuna-liga",
      "chile-primera",
      "morocco-botola-pro",
      "egypt-premier-league",
      "romania-superliga",
      "liga-mx",
      "chinese-super-league",
      "k-league",
      "copa-del-rey",
      "bolivia-lfpb",
      "2-bundesliga",
      "fifa-friendlies",
      "uefa-europa-conference-league",
      "uel",
      "efl-cup",
      "coppa-italia",
      "coupe-de-france",
    ],
  },
  {
    slug: "tennis",
    label: "Tennis",
    children: ["atp", "wta"],
  },
  {
    slug: "cricket",
    label: "Cricket",
    children: ["international-cricket", "indian-premier-league", "pakistan-super-league", "legends"],
  },
  {
    slug: "basketball",
    label: "Basketball",
    children: [
      "nba",
      "lnb",
      "cwbb",
      "kbl",
      "aba-league",
      "germany-bbl",
      "cba",
      "greek-basketball-league",
      "euroleague-basketball",
      "pro-a",
      "turkey-bsl",
      "liga-endesa",
      "vtb-united-league",
      "japan-b-league",
      "serie-a-basketball",
    ],
  },
  {
    slug: "baseball",
    label: "Baseball",
    children: ["mlb", "kbo"],
  },
  {
    slug: "hockey",
    label: "Hockey",
    children: [
      "nhl",
      "american-hockey-league",
      "kontinental-hockey-league",
      "czech-extraliga",
      "swedish-hockey-league",
      "deutsche-eishockey-liga",
      "cehl",
    ],
  },
  {
    slug: "rugby",
    label: "Rugby",
    children: [
      "super-rugby-pacific",
      "premiership-rugby",
      "united-rugby-championship",
      "top-14",
      "european-rugby-champions-cup",
    ],
  },
  {
    slug: "esports",
    label: "Esports",
    children: [
      "league-of-legends",
      "dota-2",
      "counter-strike-2",
      "valorant",
      "call-of-duty",
      "honor-of-kings",
      "culture",
      "sea",
    ],
  },
] as const;

const MARKS: Record<string, string> = {
  "all-sports": "AS",
  nba: "NB",
  ucl: "UC",
  nhl: "NH",
  ufc: "UF",
  football: "FB",
  soccer: "SC",
  tennis: "TN",
  cricket: "CR",
  basketball: "BK",
  baseball: "BS",
  hockey: "HK",
  rugby: "RG",
  golf: "GF",
  formula1: "F1",
  boxing: "BX",
  esports: "ES",
  "league-of-legends": "LG",
  "dota-2": "D2",
  "counter-strike-2": "CS",
  valorant: "VL",
  nfl: "NF",
  "nfl-draft": "ND",
  cfb: "CF",
  atp: "AT",
  wta: "WT",
  mlb: "ML",
  kbo: "KB",
};

const TONES: Record<string, SportsRailTone> = {
  "all-sports": { bg: "#EEF2F6", fg: "#667487" },
  nba: { bg: "#FCE6DB", fg: "#E06D2C" },
  ucl: { bg: "#ECEFF3", fg: "#98A3AF" },
  nhl: { bg: "#E5F4EB", fg: "#219653" },
  ufc: { bg: "#FDE8E8", fg: "#E54848" },
  football: { bg: "#E8EFFC", fg: "#335BBA" },
  soccer: { bg: "#E6F5EA", fg: "#209A52" },
  tennis: { bg: "#EEF9D9", fg: "#8DB61A" },
  cricket: { bg: "#E8F4F7", fg: "#2E9BB6" },
  basketball: { bg: "#FCE6DB", fg: "#E06D2C" },
  baseball: { bg: "#FDECEC", fg: "#DC5A5A" },
  hockey: { bg: "#E5F4EB", fg: "#219653" },
  rugby: { bg: "#FAEEE5", fg: "#B5672A" },
  golf: { bg: "#E6F5EA", fg: "#209A52" },
  formula1: { bg: "#FDECEC", fg: "#DB3C3C" },
  boxing: { bg: "#FDECEC", fg: "#D34B4B" },
  esports: { bg: "#F0EAFE", fg: "#7B4DDB" },
  default: { bg: "#EEF2F6", fg: "#667487" },
};

const normalizeSlug = (value: string): string =>
  value.trim().toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-|-$/g, "");

const getMark = (slug: string, label: string): string =>
  MARKS[slug] ?? (label.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase() || "SP");

const getTone = (slug: string): SportsRailTone => TONES[slug] ?? TONES.default;

const buildLeaf = ({
  chip,
  active,
}: {
  chip: SportsLeagueChip;
  active: boolean;
}): SportsRailLeaf => ({
  kind: "leaf",
  slug: chip.slug,
  label: chip.label,
  href: chip.href,
  count: chip.count,
  active,
  mark: getMark(chip.slug, chip.label),
  tone: getTone(chip.slug),
});

export const buildSportsDesktopRailModel = ({
  chips,
  activeLeagueSlug,
}: {
  chips: ReadonlyArray<SportsLeagueChip>;
  activeLeagueSlug?: string;
}): SportsDesktopRailModel => {
  const activeSlug = activeLeagueSlug ? normalizeSlug(activeLeagueSlug) : undefined;
  const chipMap = new Map(chips.map((chip) => [chip.slug, chip] as const));
  const consumed = new Set<string>();
  const featuredSet = new Set<string>(FEATURED_LEAF_ORDER);

  const topLeafs: SportsRailLeaf[] = [
    {
      kind: "leaf",
      slug: "all-sports",
      label: "All Sports",
      href: "/sports/live",
      active: !activeSlug,
      mark: MARKS["all-sports"],
      tone: TONES["all-sports"],
    },
  ];

  for (const slug of FEATURED_LEAF_ORDER) {
    const chip = chipMap.get(slug);
    if (!chip) continue;

    consumed.add(slug);
    topLeafs.push(
      buildLeaf({
        chip,
        active: activeSlug === slug,
      }),
    );
  }

  const groups: SportsRailGroup[] = [];

  for (const groupConfig of GROUP_ORDER) {
    const children = groupConfig.children
      .map((slug) => chipMap.get(slug))
      .filter((chip): chip is SportsLeagueChip => Boolean(chip))
      .map((chip) =>
        buildLeaf({
          chip,
          active:
            activeSlug === chip.slug && !featuredSet.has(chip.slug),
        }),
      );

    if (children.length === 0) continue;

    for (const child of children) {
      consumed.add(child.slug);
    }

    groups.push({
      kind: "group",
      slug: groupConfig.slug,
      label: groupConfig.label,
      mark: getMark(groupConfig.slug, groupConfig.label),
      tone: getTone(groupConfig.slug),
      active: children.some((child) => child.active),
      children,
    });
  }

  const trailingLeafs: SportsRailLeaf[] = [];

  for (const slug of TRAILING_LEAF_ORDER) {
    const chip = chipMap.get(slug);
    if (!chip) continue;

    consumed.add(slug);
    trailingLeafs.push(
      buildLeaf({
        chip,
        active: activeSlug === slug,
      }),
    );
  }

  const remainingLeafs = chips
    .filter((chip) => !consumed.has(chip.slug))
    .map((chip) =>
      buildLeaf({
        chip,
        active: activeSlug === chip.slug,
      }),
    )
    .sort(
      (left, right) =>
        (right.count ?? 0) - (left.count ?? 0) || left.label.localeCompare(right.label),
    );

  return {
    topLeafs,
    groups,
    trailingLeafs: [...trailingLeafs, ...remainingLeafs],
  };
};
