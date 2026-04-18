import { describe, expect, it } from "vitest";
import {
  formatCents,
  formatEndDate,
  formatFullUSD,
  formatPct,
  formatVolume,
} from "./format";

describe("formatPct", () => {
  it("rounds typical values to integer percent", () => {
    expect(formatPct(0.1715)).toBe("17%");
    expect(formatPct(0.828)).toBe("83%");
  });

  it("handles zero", () => {
    expect(formatPct(0)).toBe("0%");
  });

  it("handles one", () => {
    expect(formatPct(1)).toBe("100%");
  });

  it("handles NaN safely", () => {
    expect(formatPct(Number.NaN)).toBe("0%");
  });
});

describe("formatCents", () => {
  it("formats with one decimal and cent glyph", () => {
    expect(formatCents(0.172)).toBe("17.2¢");
  });

  it("handles zero", () => {
    expect(formatCents(0)).toBe("0.0¢");
  });

  it("handles edge near 1", () => {
    expect(formatCents(0.999)).toBe("99.9¢");
  });

  it("handles negative price", () => {
    expect(formatCents(-0.05)).toBe("-5.0¢");
  });
});

describe("formatVolume", () => {
  it("abbreviates millions", () => {
    expect(formatVolume(13_653_342)).toBe("$13M");
  });

  it("abbreviates billions", () => {
    expect(formatVolume(2_500_000_000)).toBe("$2B");
  });

  it("abbreviates thousands", () => {
    expect(formatVolume(45_200)).toBe("$45K");
  });

  it("leaves small values without abbreviation", () => {
    expect(formatVolume(812)).toBe("$812");
  });

  it("handles zero", () => {
    expect(formatVolume(0)).toBe("$0");
  });

  it("handles NaN safely", () => {
    expect(formatVolume(Number.NaN)).toBe("$0");
  });
});

describe("formatFullUSD", () => {
  it("comma-groups and rounds", () => {
    expect(formatFullUSD(13_653_342)).toBe("$13,653,342");
  });

  it("handles zero", () => {
    expect(formatFullUSD(0)).toBe("$0");
  });

  it("handles small whole values", () => {
    expect(formatFullUSD(42)).toBe("$42");
  });
});

describe("formatEndDate", () => {
  it("formats ISO dates in UTC", () => {
    expect(formatEndDate("2026-07-20T00:00:00Z")).toBe("Jul 20, 2026");
  });

  it("returns empty string for invalid input", () => {
    expect(formatEndDate("not-a-date")).toBe("");
  });
});
