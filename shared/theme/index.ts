export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "polymarket-clone-theme";
export const THEME_CHANGE_EVENT = "polymarket-clone-theme-change";

const LIGHT_MEDIA_QUERY = "(prefers-color-scheme: light)";

export const isTheme = (value: string | null | undefined): value is Theme =>
  value === "dark" || value === "light";

export const resolveThemeSelection = (
  storedTheme: string | null,
  prefersLight: boolean,
): Theme => {
  if (isTheme(storedTheme)) {
    return storedTheme;
  }
  return prefersLight ? "light" : "dark";
};

const getMediaPreference = (): boolean =>
  typeof window.matchMedia === "function" &&
  window.matchMedia(LIGHT_MEDIA_QUERY).matches;

export const readStoredTheme = (): Theme | null => {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(storedTheme) ? storedTheme : null;
  } catch {
    return null;
  }
};

export const readAppliedTheme = (): Theme | null => {
  if (typeof document === "undefined") {
    return null;
  }

  const appliedTheme = document.documentElement.dataset.theme;
  return isTheme(appliedTheme) ? appliedTheme : null;
};

export const readResolvedTheme = (): Theme => {
  const appliedTheme = readAppliedTheme();
  if (appliedTheme) {
    return appliedTheme;
  }

  if (typeof window === "undefined") {
    return "dark";
  }

  return resolveThemeSelection(readStoredTheme(), getMediaPreference());
};

export const applyTheme = (theme: Theme) => {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore private browsing or disabled storage failures.
  }

  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
};

export const subscribeToThemeChanges = (listener: () => void) => {
  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== THEME_STORAGE_KEY) {
      return;
    }
    listener();
  };

  const mediaQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia(LIGHT_MEDIA_QUERY)
      : null;
  const handleMediaChange = () => {
    if (!readStoredTheme()) {
      listener();
    }
  };

  window.addEventListener(THEME_CHANGE_EVENT, listener);
  window.addEventListener("storage", handleStorage);
  mediaQuery?.addEventListener("change", handleMediaChange);

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, listener);
    window.removeEventListener("storage", handleStorage);
    mediaQuery?.removeEventListener("change", handleMediaChange);
  };
};

export const themeBootstrapScript = `
  (() => {
    try {
      const storageKey = ${JSON.stringify(THEME_STORAGE_KEY)};
      const storedTheme = window.localStorage.getItem(storageKey);
      const prefersLight = window.matchMedia(${JSON.stringify(LIGHT_MEDIA_QUERY)}).matches;
      const theme = storedTheme === "light" || storedTheme === "dark"
        ? storedTheme
        : prefersLight
          ? "light"
          : "dark";

      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
    } catch {
      // Ignore storage access issues and fall back to CSS media queries.
    }
  })();
`;
