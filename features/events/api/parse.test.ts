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
