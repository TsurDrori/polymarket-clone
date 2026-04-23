import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProbabilityArc } from "./ProbabilityArc";

const renderValuePath = (price: number): string | null => {
  const { container } = render(<ProbabilityArc price={price} label="Chance" />);
  return container.querySelectorAll("path")[1]?.getAttribute("d") ?? null;
};

describe("ProbabilityArc", () => {
  it("keeps low probabilities on the top half of the semicircle", () => {
    expect(renderValuePath(0.25)).toBe(
      "M -24 2.9391523179536475e-15 A 24 24 0 0 1 -16.970562748477143 -16.97056274847714",
    );
  });

  it("uses the large-arc path for values above 50 percent without flipping direction", () => {
    expect(renderValuePath(0.75)).toBe(
      "M -24 2.9391523179536475e-15 A 24 24 0 1 1 16.970562748477136 -16.970562748477143",
    );
  });

  it("clamps out-of-range values to the valid semicircle endpoints", () => {
    expect(renderValuePath(-1)).toBe("M -24 2.9391523179536475e-15 A 24 24 0 0 1 -24 2.9391523179536475e-15");
    expect(renderValuePath(2)).toBe("M -24 2.9391523179536475e-15 A 24 24 0 1 1 24 -5.878304635907295e-15");
  });
});
