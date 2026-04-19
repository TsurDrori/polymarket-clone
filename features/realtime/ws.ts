import { handleMessage } from "./dispatcher";

const MARKET_WS_URL = "wss://ws-subscriptions-clob.polymarket.com/ws/market";
const WS_STATE_KEY = "__plaeePolymarketWsClient__";
const HEARTBEAT_INTERVAL_MS = 10_000;
const INITIAL_RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 8_000;
const PREOPEN_BUFFER_LIMIT = 32;

type GetAssetIds = () => ReadonlyArray<string>;
type OpenCallback = () => void;
type ReopenCallback = () => void;

type WsClientState = {
  socket: WebSocket | null;
  getAssetIds: GetAssetIds | null;
  preOpenBuffer: string[];
  reconnectDelayMs: number;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  heartbeatTimer: ReturnType<typeof setInterval> | null;
  openCallbacks: Set<OpenCallback>;
  reopenCallbacks: Set<ReopenCallback>;
  hasOpenedSuccessfully: boolean;
};

type WsGlobal = typeof globalThis & {
  [WS_STATE_KEY]?: WsClientState;
};

const isBrowser = (): boolean =>
  typeof window !== "undefined" && typeof WebSocket !== "undefined";

const createClientState = (): WsClientState => ({
  socket: null,
  getAssetIds: null,
  preOpenBuffer: [],
  reconnectDelayMs: INITIAL_RECONNECT_DELAY_MS,
  reconnectTimer: null,
  heartbeatTimer: null,
  openCallbacks: new Set(),
  reopenCallbacks: new Set(),
  hasOpenedSuccessfully: false,
});

const getClientState = (): WsClientState | null => {
  if (!isBrowser()) {
    return null;
  }

  const wsGlobal = globalThis as WsGlobal;
  wsGlobal[WS_STATE_KEY] ??= createClientState();
  return wsGlobal[WS_STATE_KEY];
};

const getAssetIds = (state: WsClientState): string[] => {
  const assetIds = state.getAssetIds?.() ?? [];
  return assetIds.filter(Boolean);
};

const serializePayload = (payload: string | object): string =>
  typeof payload === "string" ? payload : JSON.stringify(payload);

const rememberBufferedPayload = (state: WsClientState, payload: string): void => {
  if (state.preOpenBuffer.length >= PREOPEN_BUFFER_LIMIT) {
    state.preOpenBuffer.shift();
  }

  state.preOpenBuffer.push(payload);
};

const queueInitialSubscribePayload = (
  state: WsClientState,
  payload: string,
): void => {
  if (state.preOpenBuffer.length >= PREOPEN_BUFFER_LIMIT) {
    state.preOpenBuffer.pop();
  }

  state.preOpenBuffer.unshift(payload);
};

const flushPreOpenBuffer = (state: WsClientState): void => {
  const socket = state.socket;

  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return;
  }

  while (state.preOpenBuffer.length > 0) {
    const payload = state.preOpenBuffer.shift();

    if (!payload) {
      continue;
    }

    socket.send(payload);
  }
};

export const safeSend = (payload: string | object): void => {
  const state = getClientState();

  if (!state) {
    return;
  }

  const serialized = serializePayload(payload);
  const socket = state.socket;

  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(serialized);
    return;
  }

  rememberBufferedPayload(state, serialized);
};

const clearHeartbeat = (state: WsClientState): void => {
  if (state.heartbeatTimer === null) {
    return;
  }

  clearInterval(state.heartbeatTimer);
  state.heartbeatTimer = null;
};

const startHeartbeat = (state: WsClientState): void => {
  clearHeartbeat(state);
  state.heartbeatTimer = setInterval(() => {
    safeSend("PING");
  }, HEARTBEAT_INTERVAL_MS);
};

const clearReconnectTimer = (state: WsClientState): void => {
  if (state.reconnectTimer === null) {
    return;
  }

  clearTimeout(state.reconnectTimer);
  state.reconnectTimer = null;
};

const openSocket = (state: WsClientState): void => {
  if (state.reconnectTimer !== null || getAssetIds(state).length === 0) {
    return;
  }

  const socket = new WebSocket(MARKET_WS_URL);
  state.socket = socket;
  attachSocketHandlers(state, socket);
};

const scheduleReconnect = (state: WsClientState): void => {
  const assetIds = getAssetIds(state);

  if (assetIds.length === 0 || state.reconnectTimer !== null) {
    return;
  }

  const delay = state.reconnectDelayMs;
  state.reconnectTimer = setTimeout(() => {
    state.reconnectTimer = null;
    openSocket(state);
  }, delay);
  state.reconnectDelayMs = Math.min(delay * 2, MAX_RECONNECT_DELAY_MS);
};

function attachSocketHandlers(state: WsClientState, socket: WebSocket): void {
  socket.onopen = () => {
    clearReconnectTimer(state);
    state.reconnectDelayMs = INITIAL_RECONNECT_DELAY_MS;
    startHeartbeat(state);

    const assetIds = getAssetIds(state);

    if (assetIds.length > 0) {
      queueInitialSubscribePayload(
        state,
        JSON.stringify({ assets_ids: assetIds, type: "market" }),
      );
    }

    flushPreOpenBuffer(state);

    for (const callback of state.openCallbacks) {
      callback();
    }

    if (state.hasOpenedSuccessfully) {
      for (const callback of state.reopenCallbacks) {
        callback();
      }
    }

    state.hasOpenedSuccessfully = true;
  };

  socket.onmessage = (event) => {
    if (typeof event.data !== "string" || event.data === "PONG") {
      return;
    }

    handleMessage(event.data);
  };

  socket.onclose = () => {
    clearHeartbeat(state);

    if (state.socket === socket) {
      state.socket = null;
    }

    scheduleReconnect(state);
  };
}

export const connect = (nextGetAssetIds: GetAssetIds): WebSocket | null => {
  const state = getClientState();

  if (!state) {
    return null;
  }

  state.getAssetIds = nextGetAssetIds;

  if (getAssetIds(state).length === 0) {
    return null;
  }

  if (state.socket && state.socket.readyState !== WebSocket.CLOSED) {
    attachSocketHandlers(state, state.socket);
    return state.socket;
  }

  if (state.reconnectTimer !== null) {
    return null;
  }

  openSocket(state);
  return state.socket;
};

export const hasOpenSocket = (): boolean => {
  const state = getClientState();

  return state?.socket?.readyState === WebSocket.OPEN;
};

export const onOpen = (callback: OpenCallback): (() => void) => {
  const state = getClientState();

  if (!state) {
    return () => {};
  }

  state.openCallbacks.add(callback);

  return () => {
    state.openCallbacks.delete(callback);
  };
};

export const onReopen = (callback: ReopenCallback): (() => void) => {
  const state = getClientState();

  if (!state) {
    return () => {};
  }

  state.reopenCallbacks.add(callback);

  return () => {
    state.reopenCallbacks.delete(callback);
  };
};

export const __resetWsClientForTests = (): void => {
  if (!isBrowser()) {
    return;
  }

  const wsGlobal = globalThis as WsGlobal;
  const state = wsGlobal[WS_STATE_KEY];

  if (!state) {
    return;
  }

  clearHeartbeat(state);
  clearReconnectTimer(state);

  if (state.socket) {
    state.socket.onopen = null;
    state.socket.onmessage = null;
    state.socket.onclose = null;
    state.socket = null;
  }

  delete wsGlobal[WS_STATE_KEY];
};
