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

  close(): void {
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.(new CloseEvent("close"));
  }

  static reset(): void {
    FakeWebSocket.instances = [];
  }
}

const loadModules = async () => {
  const subscriptions = await import("./subscriptions");
  const ws = await import("./ws");

  return { subscriptions, ws };
};

describe("subscriptions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("WebSocket", FakeWebSocket);
  });

  afterEach(async () => {
    const { subscriptions, ws } = await loadModules();
    subscriptions.__resetSubscriptionsForTests();
    ws.__resetWsClientForTests();
    FakeWebSocket.reset();
    vi.unstubAllGlobals();
    vi.resetModules();
    vi.useRealTimers();
  });

  it("dedupes duplicate subscribe calls and only unsubscribes after the final ref leaves", async () => {
    const { subscriptions } = await loadModules();

    subscriptions.subscribe(["token-a", "token-a"]);
    subscriptions.subscribe(["token-a"]);

    vi.advanceTimersByTime(50);

    const socket = FakeWebSocket.instances[0];
    socket.open();

    expect(socket.sent).toEqual([
      JSON.stringify({
        assets_ids: ["token-a"],
        type: "market",
      }),
    ]);

    subscriptions.unsubscribe(["token-a"]);
    vi.advanceTimersByTime(50);

    expect(socket.sent).toHaveLength(1);

    subscriptions.unsubscribe(["token-a"]);
    vi.advanceTimersByTime(50);

    expect(socket.sent.at(-1)).toBe(
      JSON.stringify({
        assets_ids: ["token-a"],
        operation: "unsubscribe",
      }),
    );
  });

  it("coalesces mount storms into one diff send after 50ms", async () => {
    const { subscriptions } = await loadModules();

    subscriptions.subscribe(["token-a"]);
    vi.advanceTimersByTime(50);

    const socket = FakeWebSocket.instances[0];
    socket.open();
    socket.sent = [];

    subscriptions.subscribe(["token-b"]);
    subscriptions.subscribe(["token-c", "token-c"]);

    vi.advanceTimersByTime(49);
    expect(socket.sent).toEqual([]);

    vi.advanceTimersByTime(1);

    expect(socket.sent).toEqual([
      JSON.stringify({
        assets_ids: ["token-b", "token-c"],
        operation: "subscribe",
      }),
    ]);
  });

  it("replays the current active token set after a socket reopen", async () => {
    const { subscriptions } = await loadModules();

    subscriptions.subscribe(["token-a", "token-b"]);
    vi.advanceTimersByTime(50);

    const firstSocket = FakeWebSocket.instances[0];
    firstSocket.open();

    firstSocket.close();

    subscriptions.unsubscribe(["token-a"]);
    subscriptions.subscribe(["token-c"]);
    vi.advanceTimersByTime(50);

    vi.advanceTimersByTime(1_000);

    const reopenedSocket = FakeWebSocket.instances[1];
    reopenedSocket.open();

    expect(reopenedSocket.sent).toEqual([
      JSON.stringify({
        assets_ids: ["token-b", "token-c"],
        type: "market",
      }),
    ]);
  });
});
