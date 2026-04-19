import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

class FakeWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;
  static instances: FakeWebSocket[] = [];

  readonly url: string;
  readyState = FakeWebSocket.CONNECTING;
  sent: string[] = [];
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  send(payload: string): void {
    this.sent.push(payload);
  }

  open(): void {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.(new Event("open"));
  }

  emitMessage(data: string): void {
    this.onmessage?.({ data } as MessageEvent);
  }

  close(): void {
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.(new CloseEvent("close"));
  }

  static reset(): void {
    FakeWebSocket.instances = [];
  }
}

const loadModule = async () => import("./ws");

describe("ws client", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("WebSocket", FakeWebSocket);
  });

  afterEach(async () => {
    const ws = await loadModule();
    ws.__resetWsClientForTests();
    FakeWebSocket.reset();
    vi.unstubAllGlobals();
    vi.resetModules();
    vi.useRealTimers();
  });

  it("does not connect when no asset ids are available yet", async () => {
    const ws = await loadModule();

    expect(ws.connect(() => [])).toBeNull();
    expect(FakeWebSocket.instances).toHaveLength(0);
  });

  it("sends the initial subscribe payload exactly once per open", async () => {
    const ws = await loadModule();

    ws.connect(() => ["token-a", "token-b"]);

    const socket = FakeWebSocket.instances[0];
    socket.open();

    expect(socket.sent).toEqual([
      JSON.stringify({
        assets_ids: ["token-a", "token-b"],
        type: "market",
      }),
    ]);
  });

  it("flushes buffered sends after the socket opens", async () => {
    const ws = await loadModule();

    ws.connect(() => ["token-a"]);
    ws.safeSend({ assets_ids: ["token-c"], operation: "subscribe" });

    const socket = FakeWebSocket.instances[0];

    expect(socket.sent).toEqual([]);

    socket.open();

    expect(socket.sent).toEqual([
      JSON.stringify({
        assets_ids: ["token-a"],
        type: "market",
      }),
      JSON.stringify({
        assets_ids: ["token-c"],
        operation: "subscribe",
      }),
    ]);
  });

  it("starts the heartbeat on open and clears it on close", async () => {
    const ws = await loadModule();

    ws.connect(() => ["token-a"]);

    const socket = FakeWebSocket.instances[0];
    socket.open();

    vi.advanceTimersByTime(10_000);
    expect(socket.sent.at(-1)).toBe("PING");

    socket.close();
    vi.advanceTimersByTime(10_000);

    expect(socket.sent.filter((payload) => payload === "PING")).toHaveLength(1);
  });

  it("caps reconnect backoff at 8 seconds and resets it after a successful reopen", async () => {
    const ws = await loadModule();

    ws.connect(() => ["token-a"]);
    FakeWebSocket.instances[0].close();

    vi.advanceTimersByTime(1_000);
    FakeWebSocket.instances[1].close();

    vi.advanceTimersByTime(2_000);
    FakeWebSocket.instances[2].close();

    vi.advanceTimersByTime(4_000);
    FakeWebSocket.instances[3].close();

    vi.advanceTimersByTime(7_999);
    expect(FakeWebSocket.instances).toHaveLength(4);

    vi.advanceTimersByTime(1);
    expect(FakeWebSocket.instances).toHaveLength(5);

    FakeWebSocket.instances[4].close();
    vi.advanceTimersByTime(8_000);
    expect(FakeWebSocket.instances).toHaveLength(6);

    FakeWebSocket.instances[5].open();
    FakeWebSocket.instances[5].close();

    vi.advanceTimersByTime(999);
    expect(FakeWebSocket.instances).toHaveLength(6);

    vi.advanceTimersByTime(1);
    expect(FakeWebSocket.instances).toHaveLength(7);
  });

  it("fires reopen callbacks after reconnecting", async () => {
    const ws = await loadModule();
    const onReopen = vi.fn();

    ws.onReopen(onReopen);
    ws.connect(() => ["token-a"]);
    FakeWebSocket.instances[0].open();

    expect(onReopen).not.toHaveBeenCalled();

    FakeWebSocket.instances[0].close();
    vi.advanceTimersByTime(1_000);
    FakeWebSocket.instances[1].open();

    expect(onReopen).toHaveBeenCalledTimes(1);
  });

  it("reuses the HMR-persisted singleton without duplicating timers or listeners", async () => {
    const firstModule = await loadModule();

    firstModule.connect(() => ["token-a"]);
    FakeWebSocket.instances[0].open();

    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(vi.getTimerCount()).toBe(1);

    vi.resetModules();
    const secondModule = await loadModule();

    secondModule.connect(() => ["token-a"]);

    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(vi.getTimerCount()).toBe(1);

    FakeWebSocket.instances[0].close();

    expect(vi.getTimerCount()).toBe(1);

    vi.advanceTimersByTime(1_000);

    expect(FakeWebSocket.instances).toHaveLength(2);
  });
});
