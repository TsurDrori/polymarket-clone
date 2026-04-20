import { describe, expect, it } from "vitest";
import { isTabActive } from "./activeTab";

describe("isTabActive", () => {
  it("treats Trending (/) as active only on exact root", () => {
    expect(isTabActive("/", "/")).toBe(true);
    expect(isTabActive("/crypto", "/")).toBe(false);
    expect(isTabActive("/sports/live", "/")).toBe(false);
  });

  it("matches a category route exactly", () => {
    expect(isTabActive("/sports", "/sports")).toBe(true);
    expect(isTabActive("/crypto", "/crypto")).toBe(true);
  });

  it("keeps the parent tab active on nested subroutes", () => {
    expect(isTabActive("/sports/live", "/sports")).toBe(true);
    expect(isTabActive("/crypto/bitcoin", "/crypto")).toBe(true);
  });

  it("does not match partial prefixes that are different segments", () => {
    expect(isTabActive("/sportsnews", "/sports")).toBe(false);
    expect(isTabActive("/cryptonews", "/crypto")).toBe(false);
  });
});
