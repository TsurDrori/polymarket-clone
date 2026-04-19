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
  it("derives snapshot prices from the best ask in array-wrapped book messages", async () => {
    const { handleMessage } = await import("./dispatcher");

    handleMessage(JSON.stringify(samples.bookSample));

    expect(enqueue).toHaveBeenCalledTimes(1);
    expect(enqueue).toHaveBeenCalledWith("<<tokenId-yes>>", {
      price: 0.995,
      bestBid: 0,
      bestAsk: 0.995,
      ts: 1776372786965,
    });
  });

  it("uses top-of-book values instead of price_change.price for live UI ticks", async () => {
    const { handleMessage } = await import("./dispatcher");

    handleMessage(JSON.stringify(samples.priceChange));

    expect(enqueue).toHaveBeenCalledTimes(2);
    expect(enqueue).toHaveBeenNthCalledWith(1, "<<tokenId-yes>>", {
      price: 1,
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

  it("refreshes snapshot prices even when book messages omit last_trade_price", async () => {
    const { handleMessage } = await import("./dispatcher");

    handleMessage(
      JSON.stringify([
        {
          event_type: "book",
          asset_id: "token-book-only",
          timestamp: "1776372817000",
          bids: [
            { price: "0.42", size: "100" },
            { price: "0.39", size: "50" },
          ],
          asks: [
            { price: "0.47", size: "25" },
            { price: "0.44", size: "80" },
          ],
        },
      ]),
    );

    expect(enqueue).toHaveBeenCalledTimes(1);
    expect(enqueue).toHaveBeenCalledWith("token-book-only", {
      price: 0.44,
      bestBid: 0.42,
      bestAsk: 0.44,
      ts: 1776372817000,
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
