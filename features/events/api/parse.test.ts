import { describe, expect, it } from "vitest";
import fixture from "@/fixtures/gamma-event-sample.json";
import { getEventImage, isValidEvent, parseEvent } from "./parse";

const raw = (fixture as { events: unknown[] }).events[0];

describe("isValidEvent", () => {
  it("accepts the fixture event", () => {
    expect(isValidEvent(raw)).toBe(true);
  });

  it("rejects null", () => {
    expect(isValidEvent(null)).toBe(false);
  });

  it("rejects events missing slug", () => {
    const broken = { ...(raw as Record<string, unknown>) };
    delete broken.slug;
    expect(isValidEvent(broken)).toBe(false);
  });

  it("rejects events missing title", () => {
    const broken = { ...(raw as Record<string, unknown>) };
    delete broken.title;
    expect(isValidEvent(broken)).toBe(false);
  });

  it("rejects events with empty markets", () => {
    expect(isValidEvent({ ...(raw as object), markets: [] })).toBe(false);
  });

  it("rejects markets missing clobTokenIds", () => {
    const base = raw as { markets: Record<string, unknown>[] };
    const broken = {
      ...(raw as object),
      markets: [{ ...base.markets[0], clobTokenIds: undefined }],
    };
    expect(isValidEvent(broken)).toBe(false);
  });

  it("rejects markets missing outcomes", () => {
    const base = raw as { markets: Record<string, unknown>[] };
    const broken = {
      ...(raw as object),
      markets: [{ ...base.markets[0], outcomes: undefined }],
    };
    expect(isValidEvent(broken)).toBe(false);
  });

  it("rejects markets missing question", () => {
    const base = raw as { markets: Record<string, unknown>[] };
    const broken = {
      ...(raw as object),
      markets: [{ ...base.markets[0], question: "" }],
    };
    expect(isValidEvent(broken)).toBe(false);
  });

  it("accepts markets when outcomePrices are omitted but the token ids and outcomes exist", () => {
    const base = raw as { markets: Record<string, unknown>[] };
    const variant = {
      ...(raw as object),
      markets: [{ ...base.markets[0], outcomePrices: undefined }],
    };
    expect(isValidEvent(variant)).toBe(true);
  });
});

describe("parseEvent", () => {
  const event = parseEvent(raw);

  it("preserves top-level identity", () => {
    expect(event.slug).toBe("2026-fifa-world-cup-winner-595");
    expect(event.title).toBe("2026 FIFA World Cup Winner");
  });

  it("coerces event volume to number", () => {
    expect(typeof event.volume).toBe("number");
    expect(event.volume).toBeGreaterThan(0);
  });

  it("parses market outcomes as string array", () => {
    expect(event.markets[0].outcomes).toEqual(["Yes", "No"]);
  });

  it("parses market outcomePrices as number array", () => {
    expect(event.markets[0].outcomePrices).toEqual([0.1715, 0.8285]);
    expect(typeof event.markets[0].outcomePrices[0]).toBe("number");
  });

  it("parses market clobTokenIds as string array", () => {
    const ids = event.markets[0].clobTokenIds;
    expect(Array.isArray(ids)).toBe(true);
    expect(ids).toHaveLength(2);
    expect(typeof ids[0]).toBe("string");
  });

  it("coerces market volume and liquidity strings to numbers", () => {
    expect(event.markets[0].volumeNum).toBeCloseTo(13653342.234, 2);
    expect(event.markets[0].liquidityNum).toBeCloseTo(1471302.249, 2);
  });

  it("keeps passthrough numerics as numbers", () => {
    const m = event.markets[0];
    expect(m.lastTradePrice).toBe(0.172);
    expect(m.bestBid).toBe(0.171);
    expect(m.bestAsk).toBe(0.172);
    expect(m.spread).toBe(0.001);
  });

  it("parses tags with slug and label", () => {
    expect(event.tags.map((t) => t.slug)).toContain("sports");
    expect(event.tags.map((t) => t.slug)).toContain("hide-from-new");
  });

  it("parses optional sports metadata without affecting generic events", () => {
    const sportsEvent = parseEvent({
      ...raw,
      startDate: undefined,
      startTime: "2026-04-19T17:00:00.000Z",
      live: true,
      ended: false,
      period: "Q3 - 08:31",
      score: "88-84",
      eventWeek: "3",
      teams: [
        {
          name: "Rockets",
          abbreviation: "HOU",
          record: "52-30",
        },
        {
          name: "Lakers",
          abbreviation: "LAL",
          record: "50-32",
        },
      ],
      eventMetadata: {
        league: "NBA",
        tournament: "Playoffs",
        context_requires_regen: false,
      },
      markets: [
        {
          ...(raw as { markets: Record<string, unknown>[] }).markets[0],
          sportsMarketType: "moneyline",
          line: "-4.5",
        },
      ],
    });

    expect(sportsEvent.startDate).toBe("2026-04-19T17:00:00.000Z");
    expect(sportsEvent.live).toBe(true);
    expect(sportsEvent.teams?.[0]?.abbreviation).toBe("HOU");
    expect(sportsEvent.eventMetadata?.league).toBe("NBA");
    expect(sportsEvent.markets[0]?.sportsMarketType).toBe("moneyline");
    expect(sportsEvent.markets[0]?.line).toBe(-4.5);
  });
});

describe("getEventImage", () => {
  it("returns event.image when set", () => {
    const event = parseEvent(raw);
    expect(getEventImage(event)).toBe(event.image);
  });

  it("falls back to icon when image is missing", () => {
    const event = parseEvent(raw);
    expect(getEventImage({ ...event, image: undefined })).toBe(event.icon);
  });

  it("falls back to first market image when event image+icon missing", () => {
    const event = parseEvent(raw);
    const variant = { ...event, image: undefined, icon: undefined };
    expect(getEventImage(variant)).toBe(event.markets[0].image);
  });

  it("returns null when no image is available anywhere", () => {
    const event = parseEvent(raw);
    const stripped = {
      ...event,
      image: undefined,
      icon: undefined,
      markets: event.markets.map((m) => ({
        ...m,
        image: undefined,
        icon: undefined,
      })),
    };
    expect(getEventImage(stripped)).toBeNull();
  });
});
