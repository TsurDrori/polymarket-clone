"use client";

import Link from "next/link";
import {
  Bookmark,
  Info,
  Menu,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import type { SVGProps } from "react";
import { useEffect, useRef, useState } from "react";
import {
  applyTheme,
  readResolvedTheme,
  subscribeToThemeChanges,
  type Theme,
} from "@/shared/theme";
import { CategoryNav } from "./CategoryNav";
import { MobileBottomNav } from "./MobileBottomNav";
import styles from "./Header.module.css";

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
  strokeWidth?: number;
};

const resolveIconDimensions = ({
  size,
  width,
  height,
}: IconProps) => ({
  width: width ?? size ?? 24,
  height: height ?? size ?? 24,
});

function XSocialIcon(props: IconProps) {
  const { width, height } = resolveIconDimensions(props);
  return (
    <svg viewBox="0 0 20 20" fill="none" width={width} height={height} {...props}>
      <path
        d="M15.272 1.587h2.811l-6.142 7.019 7.226 9.552H13.51L9.078 12.365l-5.07 5.793H1.195l6.569-7.508L.833 1.587h5.801l4.006 5.295 4.632-5.295Z"
        fill="currentColor"
      />
    </svg>
  );
}

function LeaderboardIcon(props: IconProps) {
  const { width, height } = resolveIconDimensions(props);
  return (
    <svg viewBox="0 0 24 24" fill="none" width={width} height={height} {...props}>
      <path
        d="M7 3.75h10a1 1 0 0 1 1 1v3.473a5.93 5.93 0 0 1-4.35 5.716V16.3c0 .446.253.854.653 1.053l1.862.932A1.5 1.5 0 0 1 16.5 21H7.5a1.5 1.5 0 0 1-.665-2.715l1.862-.932A1.177 1.177 0 0 0 9.35 16.3v-2.36A5.93 5.93 0 0 1 5 8.223V4.75a1 1 0 0 1 1-1Zm-3 1.9h1.05v2.35c0 .36.027.715.08 1.062H4.7a1.7 1.7 0 0 1-1.7-1.7V7.35A1.7 1.7 0 0 1 4.7 5.65H4Zm16 0h-.7A1.7 1.7 0 0 0 17.6 7.35v.012c0 .94.761 1.7 1.7 1.7h.57c.053-.347.08-.702.08-1.062V5.65Z"
        fill="currentColor"
      />
    </svg>
  );
}

function RewardsIcon(props: IconProps) {
  const { width, height } = resolveIconDimensions(props);
  return (
    <svg viewBox="0 0 24 24" fill="none" width={width} height={height} {...props}>
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path
        d="M14.95 8.9h-4.1c-.78 0-1.43.59-1.43 1.31 0 .72.65 1.3 1.43 1.3h2.3c.78 0 1.42.59 1.42 1.31 0 .72-.64 1.3-1.42 1.3H9.2M12 7.35v9.3"
        stroke="#141820"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ApisIcon(props: IconProps) {
  const { width, height } = resolveIconDimensions(props);
  return (
    <svg viewBox="0 0 24 24" fill="none" width={width} height={height} {...props}>
      <path
        d="M6.972 13.496a2.36 2.36 0 0 0 3.338 0l1.515-1.515 1.728 1.727-1.516 1.516a2.36 2.36 0 0 0 0 3.338l.84.84a1.8 1.8 0 0 0 2.545 0l1.538-1.538a1.8 1.8 0 0 0 0-2.545l-.84-.84a2.36 2.36 0 0 0-3.338 0l-.467.468-1.728-1.728.468-.467a2.36 2.36 0 0 0 0-3.338l-.84-.84a1.8 1.8 0 0 0-2.545 0L6.131 9.154a1.8 1.8 0 0 0 0 2.545l.84.84Zm6.506-6.729 1.516-1.515a2.36 2.36 0 0 1 3.338 0l.84.84a1.8 1.8 0 0 1 0 2.545l-1.538 1.538a1.8 1.8 0 0 1-2.545 0l-.84-.84a2.36 2.36 0 0 1 0-3.338l.467-.467-1.238-1.238ZM4.828 14.825a1.8 1.8 0 0 1 2.545 0l.84.84a2.36 2.36 0 0 1 0 3.338l-1.516 1.515a2.36 2.36 0 0 1-3.338 0l-.84-.84a1.8 1.8 0 0 1 0-2.545l1.538-1.538Z"
        fill="currentColor"
      />
    </svg>
  );
}

function DarkModeIcon(props: IconProps) {
  const { width, height } = resolveIconDimensions(props);
  return (
    <svg viewBox="0 0 24 24" fill="none" width={width} height={height} {...props}>
      <path
        d="M18.7 14.918c-4.967 0-9-4.024-9-8.987 0-1.183.23-2.312.647-3.346A9.003 9.003 0 1 0 21 13.729a8.96 8.96 0 0 1-2.3 1.189Z"
        fill="currentColor"
      />
    </svg>
  );
}

function TikTokSocialIcon(props: IconProps) {
  const { width, height } = resolveIconDimensions(props);
  return (
    <svg viewBox="0 0 20 20" fill="none" width={width} height={height} {...props}>
      <path
        d="M14.227 0h-3.37v13.623c0 1.623-1.297 2.957-2.91 2.957s-2.91-1.334-2.91-2.957c0-1.594 1.268-2.898 2.824-2.956V7.246c-3.428.058-6.194 2.87-6.194 6.377C1.667 17.159 4.49 20 7.976 20s6.309-2.87 6.309-6.377V6.638c1.267.927 2.823 1.478 4.465 1.507V4.725c-2.535-.087-4.523-2.174-4.523-4.725Z"
        fill="currentColor"
      />
    </svg>
  );
}

function DiscordSocialIcon(props: IconProps) {
  const { width, height } = resolveIconDimensions(props);
  return (
    <svg viewBox="0 0 20 20" fill="none" width={width} height={height} {...props}>
      <path
        d="M16.328 4.318A13.737 13.737 0 0 0 12.92 3.25a9.59 9.59 0 0 0-.437.9 12.6 12.6 0 0 0-4.965 0 9.58 9.58 0 0 0-.436-.9 13.8 13.8 0 0 0-3.412 1.07C1.511 7.464.928 10.53 1.219 13.553a13.85 13.85 0 0 0 4.188 2.104c.34-.45.644-.93.907-1.436a8.94 8.94 0 0 1-1.43-.692c.12-.087.236-.178.348-.274 2.76 1.29 5.75 1.29 8.478 0 .114.096.23.187.349.274-.448.264-.927.496-1.43.692.263.506.566.986.907 1.436a13.8 13.8 0 0 0 4.19-2.104c.341-3.506-.582-6.543-2.398-9.235ZM7.009 11.711c-.826 0-1.505-.758-1.505-1.688s.663-1.688 1.505-1.688c.854 0 1.52.768 1.505 1.688.001.93-.666 1.688-1.505 1.688Zm5.981 0c-.825 0-1.505-.758-1.505-1.688s.663-1.688 1.505-1.688c.855 0 1.52.768 1.506 1.688 0 .93-.667 1.688-1.506 1.688Z"
        fill="currentColor"
      />
    </svg>
  );
}

function InstagramSocialIcon(props: IconProps) {
  const { width, height } = resolveIconDimensions(props);
  return (
    <svg viewBox="0 0 20 20" fill="none" width={width} height={height} {...props}>
      <rect
        x="3.15"
        y="3.15"
        width="13.7"
        height="13.7"
        rx="4.2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="10" cy="10" r="3.15" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="14.25" cy="5.75" r="1.05" fill="currentColor" />
    </svg>
  );
}

const DESKTOP_MENU_ITEMS = [
  { label: "Leaderboard", icon: LeaderboardIcon, iconColor: "#ffb700" },
  { label: "Rewards", icon: RewardsIcon, iconColor: "#35b66f" },
  { label: "APIs", icon: ApisIcon, iconColor: "#e6468f" },
] as const;

const MOBILE_SECONDARY_ITEMS = [
  { label: "Accuracy" },
  {
    label: "Documentation",
    href: "https://docs.polymarket.com",
    external: true,
  },
  {
    label: "Help Center",
    href: "https://help.polymarket.com",
    external: true,
  },
  { label: "Terms of Use", href: "https://polymarket.com/tos", external: true },
] as const;

const MOBILE_SOCIAL_ITEMS = [
  { label: "X", icon: XSocialIcon, href: "https://x.com/Polymarket" },
  { label: "Discord", icon: DiscordSocialIcon, href: "https://discord.gg/Polymarket" },
  {
    label: "Instagram",
    icon: InstagramSocialIcon,
    href: "https://www.instagram.com/polymarket",
  },
  { label: "TikTok", icon: TikTokSocialIcon, href: "https://www.tiktok.com/@polymarket" },
] as const;

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => readResolvedTheme());
  const panelRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return subscribeToThemeChanges(() => {
      setTheme(readResolvedTheme());
    });
  }, []);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    panelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) {
        return;
      }

      if (panelRef.current?.contains(event.target)) {
        return;
      }

      if (menuButtonRef.current?.contains(event.target)) {
        return;
      }

      setIsMenuOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isMenuOpen]);

  const focusSearch = () => {
    searchRef.current?.focus();
    searchRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          <div className={styles.utilityRow}>
            <Link href="/" className={styles.logo} aria-label="Polymarket home">
              <span aria-hidden="true" className={styles.logoMark}>
                <svg
                  viewBox="0 0 24 24"
                  className={styles.logoIcon}
                  focusable="false"
                >
                  <path
                    d="M4.5 5.5 11.7 2v20L4.5 18.5V5.5Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M11.7 2 19.5 5.7 12.3 9.2 4.5 5.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path
                    d="m12.3 9.2 7.2 3.6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className={styles.logoText}>Polymarket</span>
            </Link>

            <label className={styles.searchShell}>
              <Search className={styles.searchIcon} aria-hidden="true" />
              <input
                ref={searchRef}
                type="search"
                className={styles.searchInput}
                placeholder="Search polymarkets..."
                aria-label="Search polymarkets"
              />
              <span className={styles.searchShortcut} aria-hidden="true">
                /
              </span>
            </label>

            <div className={styles.actions}>
              <a
                href="https://docs.polymarket.com"
                target="_blank"
                rel="noreferrer"
                className={styles.howItWorks}
              >
                <Info size={15} strokeWidth={2.2} aria-hidden="true" />
                <span>How it works</span>
              </a>
              <button type="button" className={styles.authLink}>
                Log In
              </button>
              <button type="button" className={styles.signupButton}>
                Sign Up
              </button>
              <button
                ref={menuButtonRef}
                type="button"
                className={styles.menuButton}
                aria-expanded={isMenuOpen}
                aria-controls="site-menu"
                aria-haspopup="dialog"
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                onClick={() => setIsMenuOpen((open) => !open)}
              >
                <Menu size={20} strokeWidth={2.25} />
              </button>
            </div>
          </div>

          <div className={styles.navShelf}>
            <CategoryNav />
          </div>

          <div className={styles.mobileSearchRow}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={focusSearch}
              aria-label="Focus search"
            >
              <Search size={18} strokeWidth={2.2} />
              <span className={styles.mobileSearchLabel}>Search</span>
            </button>
            <button type="button" className={styles.iconButton} aria-label="Open filters">
              <SlidersHorizontal size={18} strokeWidth={2.2} />
            </button>
            <button type="button" className={styles.iconButton} aria-label="Saved markets">
              <Bookmark size={18} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        {isMenuOpen ? (
          <div className={styles.menuLayer}>
            <button
              type="button"
              className={styles.backdrop}
              aria-label="Close menu"
              onClick={() => setIsMenuOpen(false)}
            />

            <div className={styles.menuPositioner}>
              <div
                ref={panelRef}
                id="site-menu"
                role="dialog"
                aria-modal="true"
                aria-label="More"
                className={styles.menuPopover}
                data-theme={theme}
                tabIndex={-1}
              >
                <div className={styles.desktopMenu} data-theme={theme}>
                  <nav className={styles.menuNav} aria-label="More destinations">
                    {DESKTOP_MENU_ITEMS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.label}
                          type="button"
                          className={styles.menuLink}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Icon
                            className={styles.menuIcon}
                            size={22}
                            strokeWidth={2.1}
                            style={{ color: item.iconColor }}
                          />
                          <span className={styles.menuLabel}>{item.label}</span>
                        </button>
                      );
                    })}
                  </nav>

                  <div className={styles.menuDivider} />

                  <section className={styles.themeSection} aria-label="Theme controls">
                    <button
                      type="button"
                      className={styles.themeRow}
                      role="switch"
                      aria-checked={theme === "dark"}
                      aria-label="Dark mode"
                      onClick={() => applyTheme(theme === "dark" ? "light" : "dark")}
                    >
                      <span className={styles.themeMeta}>
                        <DarkModeIcon className={styles.themeRowIcon} aria-hidden="true" />
                        <span className={styles.themeRowLabel}>Dark mode</span>
                      </span>

                      <span className={styles.themeSwitch} aria-hidden="true">
                        <span className={styles.themeSwitchThumb} />
                      </span>
                    </button>
                  </section>
                </div>

                <div className={styles.mobileDrawer} data-theme={theme}>
                  <nav className={styles.mobilePrimaryNav} aria-label="Primary menu links">
                    {DESKTOP_MENU_ITEMS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.label}
                          type="button"
                          className={styles.mobilePrimaryLink}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Icon
                            className={styles.mobilePrimaryIcon}
                            size={22}
                            strokeWidth={2.1}
                            style={{ color: item.iconColor }}
                          />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </nav>

                  <div className={styles.mobileDivider} />

                  <div className={styles.mobileSecondaryNav}>
                    {MOBILE_SECONDARY_ITEMS.map((item) =>
                      "href" in item ? (
                        <a
                          key={item.label}
                          href={item.href}
                          target={item.external ? "_blank" : undefined}
                          rel={item.external ? "noreferrer" : undefined}
                          className={styles.mobileSecondaryLink}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {item.label}
                        </a>
                      ) : (
                        <button
                          key={item.label}
                          type="button"
                          className={styles.mobileSecondaryLink}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {item.label}
                        </button>
                      ),
                    )}

                    <button
                      type="button"
                      className={styles.mobileLanguageRow}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className={styles.mobileLanguageMeta}>
                        <span className={styles.mobileFlag} aria-hidden="true">
                          🇺🇸
                        </span>
                        <span>Language</span>
                      </span>
                      <span className={styles.mobileLanguageValue}>English</span>
                    </button>
                  </div>

                  <div className={styles.mobileSocialRow}>
                    {MOBILE_SOCIAL_ITEMS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <a
                          key={item.label}
                          href={item.href}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.mobileSocialButton}
                          aria-label={item.label}
                        >
                          <Icon size={22} strokeWidth={2} aria-hidden="true" />
                        </a>
                      );
                    })}

                    <button
                      type="button"
                      className={styles.mobileSocialButton}
                      aria-label="Toggle theme"
                      onClick={() => applyTheme(theme === "dark" ? "light" : "dark")}
                    >
                      <DarkModeIcon className={styles.mobileThemeIcon} aria-hidden="true" />
                    </button>
                  </div>

                  <div className={styles.mobileAuthStack}>
                    <button type="button" className={styles.mobileLoginButton}>
                      Log In
                    </button>
                    <button type="button" className={styles.mobileSignupButton}>
                      Sign Up
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <MobileBottomNav
        onSearch={focusSearch}
        onMore={() => setIsMenuOpen(true)}
      />
    </>
  );
}
