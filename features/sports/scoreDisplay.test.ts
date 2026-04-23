import { describe, expect, it } from "vitest";
import {
  normalizeSportsScore,
  parseDisplayedSportsScoreParts,
} from "./scoreDisplay";

describe("sports score display helpers", () => {
  it("drops plain placeholder zero scores", () => {
    expect(normalizeSportsScore("0-0")).toBeUndefined();
    expect(normalizeSportsScore("000-000")).toBeUndefined();
  });

  it("extracts the meaningful esports series score from composite feeds", () => {
    expect(normalizeSportsScore("000-000|2-0|Bo3")).toBe("2-0");
    expect(normalizeSportsScore("000-000|1-1|Bo3")).toBe("1-1");
    expect(normalizeSportsScore("000-000|0-0|Bo3")).toBeUndefined();
  });

  it("keeps non-placeholder final scores intact", () => {
    expect(normalizeSportsScore("101-98")).toBe("101-98");
    expect(normalizeSportsScore("6-3, 6-7(6-8), 6-7(4-7)")).toBe(
      "6-3, 6-7(6-8), 6-7(4-7)",
    );
  });

  it("only returns competitor score parts for simple head-to-head scores", () => {
    expect(parseDisplayedSportsScoreParts("101-98")).toEqual(["101", "98"]);
    expect(parseDisplayedSportsScoreParts("000-000|2-0|Bo3")).toEqual(["2", "0"]);
    expect(parseDisplayedSportsScoreParts("6-3, 6-7(6-8), 6-7(4-7)")).toEqual([]);
    expect(parseDisplayedSportsScoreParts("0-0")).toEqual([]);
  });
});
