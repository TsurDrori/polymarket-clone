export const isTabActive = (pathname: string, href: string): boolean => {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
};

const HOME_SECTION_IDS = new Set(["trending", "breaking-news", "all-markets"]);

export const getActiveHomeSection = (
  hash: string | null | undefined,
): "trending" | "breaking-news" | "all-markets" => {
  const normalized = hash?.replace(/^#/, "") ?? "";
  if (HOME_SECTION_IDS.has(normalized)) {
    return normalized as "trending" | "breaking-news" | "all-markets";
  }
  return "trending";
};
