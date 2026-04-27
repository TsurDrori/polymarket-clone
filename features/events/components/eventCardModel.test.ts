import { describe, expect, it } from "vitest";
import fixture from "@/fixtures/gamma-event-sample.json";
import { parseEvent } from "@/features/events/api/parse";
import type { PolymarketEvent, PolymarketMarket } from "@/features/events/types";
import {
  buildEventCardModel,
  resolveEventCardFamily,
} from "./eventCardModel";

const baseEvent = parseEvent(fixture.events[0]);
const baseMarket = baseEvent.markets[0];
const binaryEvent: PolymarketEvent = {
  ...baseEvent,
  showAllOutcomes: false,
  markets: [baseMarket],
};

const makeMarket = (
  overrides: Partial<PolymarketMarket> & Pick<PolymarketMarket, "id">,
): PolymarketMarket => ({
  ...baseMarket,
  ...overrides,
});

describe("eventCardModel", () => {
  it("resolves binary cards for single-market events", () => {
    expect(resolveEventCardFamily(binaryEvent)).toBe("binary");
  });

  it("resolves grouped cards for showAllOutcomes events with multiple markets", () => {
    const event: PolymarketEvent = {
      ...baseEvent,
      showAllOutcomes: true,
      marketStructure: "grouped-binary",
      markets: [
        makeMarket({
          id: "apr-22",
          question: "April 22",
          groupItemTitle: "April 22",
          outcomes: ["Yes", "No"],
          outcomePrices: [0.19, 0.81],
          clobTokenIds: ["apr-22-yes", "apr-22-no"],
        }),
        makeMarket({
          id: "apr-30",
          question: "April 30",
          groupItemTitle: "April 30",
          outcomes: ["Yes", "No"],
          outcomePrices: [0.37, 0.63],
          clobTokenIds: ["apr-30-yes", "apr-30-no"],
        }),
      ],
    };

    expect(resolveEventCardFamily(event)).toBe("grouped");
  });

  it("resolves grouped cards from live multi-market structure even when showAllOutcomes is false", () => {
    const event: PolymarketEvent = {
      ...baseEvent,
      showAllOutcomes: false,
      marketStructure: "grouped-binary",
      markets: [
        makeMarket({
          id: "candidate-a",
          question: "Will Candidate A win?",
          groupItemTitle: "Candidate A",
          outcomes: ["Yes", "No"],
          outcomePrices: [0.41, 0.59],
          clobTokenIds: ["candidate-a-yes", "candidate-a-no"],
        }),
        makeMarket({
          id: "candidate-b",
          question: "Will Candidate B win?",
          groupItemTitle: "Candidate B",
          outcomes: ["Yes", "No"],
          outcomePrices: [0.27, 0.73],
          clobTokenIds: ["candidate-b-yes", "candidate-b-no"],
        }),
      ],
    };

    expect(resolveEventCardFamily(event)).toBe("grouped");
  });

  it("preserves source order for grouped rows instead of sorting by volume", () => {
    const event: PolymarketEvent = {
      ...baseEvent,
      showAllOutcomes: true,
      marketStructure: "grouped-binary",
      markets: [
        makeMarket({
          id: "first",
          question: "First threshold",
          groupItemTitle: "First threshold",
          volumeNum: 1_000,
          outcomes: ["Yes", "No"],
          outcomePrices: [0.12, 0.88],
          clobTokenIds: ["first-yes", "first-no"],
        }),
        makeMarket({
          id: "second",
          question: "Second threshold",
          groupItemTitle: "Second threshold",
          volumeNum: 1_000_000,
          outcomes: ["Yes", "No"],
          outcomePrices: [0.75, 0.25],
          clobTokenIds: ["second-yes", "second-no"],
        }),
      ],
    };

    const model = buildEventCardModel(event);

    expect(model.body.kind).toBe("grouped");
    if (model.body.kind !== "grouped") {
      throw new Error("Expected grouped body");
    }

    expect(model.body.rows.map((row) => row.id)).toEqual(["first", "second"]);
  });

  it("adds a live footer label when the event is live", () => {
    const model = buildEventCardModel({
      ...baseEvent,
      live: true,
      endDate: undefined,
    });

    expect(model.footerTrailing).toBe("Live");
    expect(model.footerTrailingTone).toBe("live");
  });
});
