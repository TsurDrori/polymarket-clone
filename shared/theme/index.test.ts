import { describe, expect, it } from "vitest";
import { resolveThemeSelection } from "./index";

describe("resolveThemeSelection", () => {
  it("honors an explicit stored theme", () => {
    expect(resolveThemeSelection("light", false)).toBe("light");
    expect(resolveThemeSelection("dark", true)).toBe("dark");
  });

  it("falls back to the current media preference when storage is empty", () => {
    expect(resolveThemeSelection(null, true)).toBe("light");
    expect(resolveThemeSelection(null, false)).toBe("dark");
  });

  it("ignores invalid stored values", () => {
    expect(resolveThemeSelection("sepia", true)).toBe("light");
    expect(resolveThemeSelection("system", false)).toBe("dark");
  });
});
