import { render, screen } from "@testing-library/react";
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
    expect(screen.getByRole("link", { name: "Politics" }).getAttribute("aria-current")).toBe(
      null,
    );
    expect(screen.getByRole("link", { name: "Sports" }).getAttribute("aria-current")).toBe(null);
  });

  it("keeps Trending active when the root route carries a hash", () => {
    window.history.replaceState(null, "", "/#markets");

    render(<CategoryNav />);

    expect(screen.getByRole("link", { name: "Trending" }).getAttribute("aria-current")).toBe(
      "page",
    );
    expect(screen.getByRole("link", { name: "Politics" }).getAttribute("aria-current")).toBe(
      null,
    );
  });

  it("activates the matching category tab on non-home routes", () => {
    usePathname.mockReturnValue("/sports/live");

    render(<CategoryNav />);

    expect(screen.getByRole("link", { name: "Trending" }).getAttribute("aria-current")).toBe(
      null,
    );
    expect(screen.getByRole("link", { name: "Sports" }).getAttribute("aria-current")).toBe(
      "page",
    );
  });
});
