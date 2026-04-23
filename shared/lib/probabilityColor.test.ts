import { describe, expect, it } from "vitest";
import { clampProbability, getProbabilityColor } from "./probabilityColor";

describe("clampProbability", () => {
  it("keeps in-range values untouched", () => {
    expect(clampProbability(0.42)).toBe(0.42);
  });

  it("clamps invalid and out-of-range values", () => {
    expect(clampProbability(Number.NaN)).toBe(0);
    expect(clampProbability(-1)).toBe(0);
    expect(clampProbability(2)).toBe(1);
  });
});

describe("getProbabilityColor", () => {
  it("returns the red anchor for very low probabilities", () => {
    expect(getProbabilityColor(0)).toBe("rgb(203 49 49)");
  });

  it("returns an amber midpoint at 50 percent", () => {
    expect(getProbabilityColor(0.5)).toBe("rgb(214 171 46)");
  });

  it("returns the green anchor for very high probabilities", () => {
    expect(getProbabilityColor(1)).toBe("rgb(61 180 104)");
  });

  it("blends smoothly between the anchors", () => {
    expect(getProbabilityColor(0.25)).toBe("rgb(209 110 48)");
    expect(getProbabilityColor(0.75)).toBe("rgb(138 176 75)");
  });
});
