import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProbabilityArc } from "./ProbabilityArc";

const renderValueArc = (price: number): {
  path: string | null;
  dasharray: string | null;
} => {
  const { container } = render(<ProbabilityArc price={price} label="Chance" />);
  const valuePath = container.querySelectorAll("path")[1];

  return {
    path: valuePath?.getAttribute("d") ?? null,
    dasharray: valuePath?.getAttribute("stroke-dasharray") ?? null,
  };
};

describe("ProbabilityArc", () => {
  it("uses the same stable semicircle geometry for every probability", () => {
    expect(renderValueArc(0.25).path).toBe("M -24 0 A 24 24 0 0 1 24 0");
    expect(renderValueArc(0.75).path).toBe("M -24 0 A 24 24 0 0 1 24 0");
  });

  it("reveals the expected share of the semicircle for midpoint values", () => {
    expect(renderValueArc(0.5).dasharray).toBe("50 100");
  });

  it("clamps out-of-range values to the valid semicircle endpoints", () => {
    expect(renderValueArc(-1).dasharray).toBe("0 100");
    expect(renderValueArc(2).dasharray).toBe("100 100");
  });
});
