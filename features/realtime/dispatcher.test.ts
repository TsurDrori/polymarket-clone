import { afterEach, describe, expect, it, vi } from "vitest";
import samples from "@/fixtures/ws-message-samples.json";

const { enqueue } = vi.hoisted(() => ({
  enqueue: vi.fn(),
}));

vi.mock("./rafBatcher", () => ({
  enqueue,
}));

afterEach(() => {
  enqueue.mockReset();
});

describe("dispatcher", () => {
  it("enqueues book snapshots from array-wrapped messages", async () => {
    const { handleMessage } = await import("./dispatcher");

    handleMessage(JSON.stringify(samples.bookSample));

    expect(enqueue).toHaveBeenCalledTimes(1);
    expect(enqueue).toHaveBeenCalledWith("<<tokenId-yes>>", {
      price: 0.999,
      ts: 1776372786965,
    });
  });

  it("enqueues each price_change entry with bid and ask values", async () => {
    const { handleMessage } = await import("./dispatcher");

    handleMessage(JSON.stringify(samples.priceChange));

    expect(enqueue).toHaveBeenCalledTimes(2);
    expect(enqueue).toHaveBeenNthCalledWith(1, "<<tokenId-yes>>", {
      price: 0.999,
      bestBid: 0.999,
      bestAsk: 1,
      ts: 1776372810991,
    });
    expect(enqueue).toHaveBeenNthCalledWith(2, "<<tokenId-no>>", {
      price: 0.001,
      bestBid: 0,
      bestAsk: 0.001,
      ts: 1776372810991,
    });
  });

  it("enqueues last_trade_price updates", async () => {
    const { handleMessage } = await import("./dispatcher");

    handleMessage(JSON.stringify(samples.lastTradePrice));

    expect(enqueue).toHaveBeenCalledTimes(1);
    expect(enqueue).toHaveBeenCalledWith("<<tokenId-yes>>", {
      price: 0.998,
      ts: 1776372815000,
    });
  });

  it("treats PONG and unknown events as silent no-ops", async () => {
    const { handleMessage } = await import("./dispatcher");

    handleMessage("PONG");
    handleMessage(JSON.stringify({ event_type: "tick_size_change", asset_id: "x" }));

    expect(enqueue).not.toHaveBeenCalled();
  });
});
