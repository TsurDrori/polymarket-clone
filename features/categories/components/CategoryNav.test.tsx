import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CategoryNav } from "./CategoryNav";

const { usePathname } = vi.hoisted(() => ({
  usePathname: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname,
}));

describe("CategoryNav", () => {
  beforeEach(() => {
    usePathname.mockReturnValue("/");
    window.history.replaceState(null, "", "/");
  });

  it("defaults to the Trending tab on the root route", () => {
    render(<CategoryNav />);

    expect(screen.getByRole("link", { name: "Trending" }).getAttribute("aria-current")).toBe(
      "page",
    );
    expect(screen.getByRole("link", { name: "Breaking" }).getAttribute("aria-current")).toBe(
      null,
    );
    expect(screen.getByRole("link", { name: "New" }).getAttribute("aria-current")).toBe(null);
  });

  it("activates only the matching home section tab when a hash is present", () => {
    window.history.replaceState(null, "", "/#breaking-news");

    render(<CategoryNav />);

    expect(screen.getByRole("link", { name: "Trending" }).getAttribute("aria-current")).toBe(
      null,
    );
    expect(screen.getByRole("link", { name: "Breaking" }).getAttribute("aria-current")).toBe(
      "page",
    );
    expect(screen.getByRole("link", { name: "New" }).getAttribute("aria-current")).toBe(null);
  });

  it("updates the active tab when the hash changes through history navigation", async () => {
    render(<CategoryNav />);

    act(() => {
      window.history.pushState(null, "", "/#all-markets");
    });

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Trending" }).getAttribute("aria-current")).toBe(
        null,
      );
      expect(screen.getByRole("link", { name: "Breaking" }).getAttribute("aria-current")).toBe(
        null,
      );
      expect(screen.getByRole("link", { name: "New" }).getAttribute("aria-current")).toBe(
        "page",
      );
    });
  });
});
