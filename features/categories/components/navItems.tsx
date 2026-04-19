import type { ComponentType, SVGProps } from "react";
import { Bitcoin, House, Landmark, Search, Trophy } from "lucide-react";

type IconProps = SVGProps<SVGSVGElement>;

export function TrendingMark(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" {...props}>
      <path
        d="M2.25 11.25L5.9 7.6l2.35 2.35L13.75 4.5"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 4.5h3.25v3.25"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export type CategoryNavItem = {
  label: string;
  href: string;
  icon: ComponentType<IconProps>;
};

export type ShellLinkItem = {
  label: string;
  href?: string;
  description?: string;
  activeMatch?: string;
  sectionId?: "trending" | "breaking-news" | "all-markets";
};

export const CATEGORY_ITEMS: readonly CategoryNavItem[] = [
  { label: "Trending", href: "/", icon: TrendingMark },
  { label: "Politics", href: "/politics", icon: Landmark },
  { label: "Sports", href: "/sports/live", icon: Trophy },
  { label: "Crypto", href: "/crypto", icon: Bitcoin },
] as const;

export const HEADER_MARKET_ITEMS: readonly ShellLinkItem[] = [
  { label: "Trending", href: "/#trending", activeMatch: "/", sectionId: "trending" },
  {
    label: "Breaking",
    href: "/#breaking-news",
    activeMatch: "/",
    sectionId: "breaking-news",
  },
  { label: "New", href: "/#all-markets", activeMatch: "/", sectionId: "all-markets" },
  { label: "Politics", href: "/politics", activeMatch: "/politics" },
  { label: "Sports", href: "/sports/live", activeMatch: "/sports" },
  { label: "Crypto", href: "/crypto", activeMatch: "/crypto" },
] as const;

export const DRAWER_DESTINATION_ITEMS: readonly ShellLinkItem[] = [
  {
    label: "Trending",
    href: "/",
    description: "Top active markets across the whole exchange.",
    activeMatch: "/",
  },
  {
    label: "Politics",
    href: "/politics",
    description: "Election, policy, and geopolitical contracts.",
    activeMatch: "/politics",
  },
  {
    label: "Sports Live",
    href: "/sports/live",
    description: "Real-time match markets and in-play price action.",
    activeMatch: "/sports",
  },
  {
    label: "Sports Futures",
    href: "/sports/futures",
    description: "Season-long outrights and league winner boards.",
    activeMatch: "/sports",
  },
  {
    label: "Crypto",
    href: "/crypto",
    description: "Short-window directional trades and asset narratives.",
    activeMatch: "/crypto",
  },
] as const;

export const MOBILE_BOTTOM_ITEMS = [
  {
    label: "Home",
    href: "/#trending",
    icon: House,
    activeMatch: "/",
    sectionId: "trending",
  },
  { label: "Search", icon: Search },
  {
    label: "Breaking",
    href: "/#breaking-news",
    icon: TrendingMark,
    activeMatch: "/",
    sectionId: "breaking-news",
  },
] as const;
