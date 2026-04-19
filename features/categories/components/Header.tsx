"use client";

import Link from "next/link";
import {
  Activity,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Gift,
  Info,
  LayoutDashboard,
  Menu,
  Moon,
  Search,
  SlidersHorizontal,
  Sun,
  Trophy,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  applyTheme,
  readResolvedTheme,
  subscribeToThemeChanges,
  type Theme,
} from "@/shared/theme";
import { CategoryNav } from "./CategoryNav";
import { MobileBottomNav } from "./MobileBottomNav";
import { HEADER_TOPIC_ITEMS } from "./navItems";
import styles from "./Header.module.css";

const MENU_DESTINATION_ITEMS = [
  { label: "Activity", icon: Activity },
  { label: "Leaderboard", icon: Trophy },
  { label: "Dashboards", icon: LayoutDashboard },
  { label: "Rewards", icon: Gift },
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

            <nav className={styles.topicNav} aria-label="Popular topics">
              {HEADER_TOPIC_ITEMS.map((item) =>
                item.href ? (
                  <Link key={item.label} href={item.href} className={styles.topicLink}>
                    {item.label}
                  </Link>
                ) : (
                  <span key={item.label} className={styles.topicLabel}>
                    {item.label}
                  </span>
                ),
              )}
              <button
                type="button"
                className={styles.topicMore}
                onClick={() => setIsMenuOpen(true)}
              >
                <span>More</span>
                {isMenuOpen ? (
                  <ChevronUp size={14} strokeWidth={2.25} aria-hidden="true" />
                ) : (
                  <ChevronDown size={14} strokeWidth={2.25} aria-hidden="true" />
                )}
              </button>
            </nav>
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

          <div className={styles.mobileTopics} aria-label="Mobile topics">
            {HEADER_TOPIC_ITEMS.map((item) =>
              item.href ? (
                <Link key={item.label} href={item.href} className={styles.topicPill}>
                  {item.label}
                </Link>
              ) : (
                <span key={item.label} className={styles.topicPill}>
                  {item.label}
                </span>
              ),
            )}
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
                tabIndex={-1}
              >
                <nav className={styles.menuNav} aria-label="More destinations">
                  {MENU_DESTINATION_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        className={styles.menuLink}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Icon className={styles.menuIcon} size={17} strokeWidth={2.05} />
                        <span className={styles.menuLabel}>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>

                <div className={styles.menuDivider} />

                <section className={styles.themeSection} aria-label="Theme controls">
                  <div className={styles.themeSwitch}>
                    <button
                      type="button"
                      className={styles.themeButton}
                      aria-label="Dark theme"
                      aria-pressed={theme === "dark"}
                      onClick={() => applyTheme("dark")}
                    >
                      <Moon size={15} strokeWidth={2.15} />
                      Dark
                    </button>

                    <button
                      type="button"
                      className={styles.themeButton}
                      aria-label="Light theme"
                      aria-pressed={theme === "light"}
                      onClick={() => applyTheme("light")}
                    >
                      <Sun size={15} strokeWidth={2.15} />
                      Light
                    </button>
                  </div>
                </section>
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
