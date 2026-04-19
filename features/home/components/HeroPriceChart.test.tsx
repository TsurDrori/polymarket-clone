import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroPriceChart } from "./HeroPriceChart";

describe("HeroPriceChart", () => {
  it("renders a graceful fallback when the history payload is missing", () => {
    render(<HeroPriceChart chart={null} currentChance={0.28} />);

    expect(screen.getByText("History unavailable right now")).toBeTruthy();
    expect(screen.getByText("28% chance")).toBeTruthy();
  });

  it("renders the chart surface when a bounded history is available", () => {
    render(
      <HeroPriceChart
        currentChance={0.31}
        chart={{
          intervalLabel: "Monthly",
          sourceLabel: "Polymarket",
          points: [
            { t: 1_710_000_000, p: 0.21 },
            { t: 1_710_086_400, p: 0.28 },
            { t: 1_710_172_800, p: 0.34 },
            { t: 1_710_259_200, p: 0.29 },
            { t: 1_710_345_600, p: 0.31 },
          ],
        }}
      />,
    );

    expect(
      screen.getByRole("img", { name: "Spotlight market price history" }),
    ).toBeTruthy();
    expect(screen.queryByText("Price history")).toBeNull();
    expect(screen.getByText("25%")).toBeTruthy();
    expect(screen.getByText("Mar 9")).toBeTruthy();
  });
});
