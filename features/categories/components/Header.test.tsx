import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

    const dialog = screen.getByRole("dialog", { name: /more/i });
    expect(dialog).toBeTruthy();

    const switchControl = within(dialog).getByRole("switch", { name: /dark mode/i });
    expect(switchControl.getAttribute("aria-checked")).toBe("true");

    fireEvent.click(switchControl);

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe("light");
    });

    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(within(dialog).getByRole("switch", { name: /dark mode/i }).getAttribute("aria-checked")).toBe("false");
  });

  it("reflects a previously stored theme when the popover opens", async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");

    render(<Header />);
    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));

    await waitFor(() => {
      expect(
        within(screen.getByRole("dialog", { name: /more/i }))
          .getByRole("switch", { name: /dark mode/i })
          .getAttribute("aria-checked"),
      ).toBe("false");
    });
  });

  it("does not expose a separate mobile theme icon control in the menu", () => {
    render(<Header />);

    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));

    expect(screen.queryByRole("button", { name: /toggle theme/i })).toBeNull();
  });

  it("does not render a non-functional topic rail", () => {
    render(<Header />);

    expect(screen.queryByRole("navigation", { name: /popular topics/i })).toBeNull();
    expect(screen.queryByText("Finance")).toBeNull();
    expect(screen.queryByText("Geopolitics")).toBeNull();
  });

  it("keeps the mobile search row and breaking quick action in the shared shell", () => {
    render(<Header />);

    expect(screen.getByRole("button", { name: /open filters/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /saved markets/i })).toBeTruthy();

    const mobileQuickActions = screen.getByRole("navigation", {
      name: /mobile quick actions/i,
    });

    expect(within(mobileQuickActions).getByRole("link", { name: /breaking/i })).toBeTruthy();
  });
});
