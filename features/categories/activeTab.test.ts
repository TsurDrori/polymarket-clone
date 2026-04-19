import { describe, expect, it } from "vitest";
import { getActiveHomeSection, isTabActive } from "./activeTab";

describe("isTabActive", () => {
  it("treats Trending (/) as active only on exact root", () => {
    expect(isTabActive("/", "/")).toBe(true);
    expect(isTabActive("/politics", "/")).toBe(false);
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
    expect(isTabActive("/politicsfoo", "/politics")).toBe(false);
  });
});

describe("getActiveHomeSection", () => {
  it("defaults to trending when the hash is empty or unknown", () => {
    expect(getActiveHomeSection("")).toBe("trending");
    expect(getActiveHomeSection("#finance")).toBe("trending");
    expect(getActiveHomeSection(undefined)).toBe("trending");
  });

  it("maps supported home anchors to their matching section", () => {
    expect(getActiveHomeSection("#trending")).toBe("trending");
    expect(getActiveHomeSection("#breaking-news")).toBe("breaking-news");
    expect(getActiveHomeSection("#all-markets")).toBe("all-markets");
  });
});
