import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { THEME_STORAGE_KEY } from "@/shared/theme";
import { Header } from "./Header";

const { usePathname } = vi.hoisted(() => ({
  usePathname: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname,
}));

const setMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches,
      media: "(prefers-color-scheme: light)",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

describe("Header", () => {
  beforeEach(() => {
    usePathname.mockReturnValue("/");
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.style.colorScheme = "";
    setMatchMedia(false);
  });

  it("opens the compact menu popover and persists a light theme choice", async () => {
    render(<Header />);

    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));

    expect(screen.getByRole("dialog", { name: /more/i })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /light theme/i }));

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe("light");
    });

    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(
      screen.getByRole("button", { name: /light theme/i }).getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("reflects a previously stored theme when the popover opens", async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");

    render(<Header />);
    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /light theme/i }).getAttribute("aria-pressed"),
      ).toBe("true");
    });
  });
});
