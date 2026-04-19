import { createStore } from "jotai";

const REALTIME_STORE_KEY = "__plaeePolymarketRealtimeStore__";

type RealtimeStore = ReturnType<typeof createStore>;

type RealtimeGlobal = typeof globalThis & {
  [REALTIME_STORE_KEY]?: RealtimeStore;
};

const createRealtimeStore = (): RealtimeStore => createStore();

export const getRealtimeStore = (): RealtimeStore => {
  if (typeof window === "undefined") {
    return createRealtimeStore();
  }

  const realtimeGlobal = globalThis as RealtimeGlobal;
  realtimeGlobal[REALTIME_STORE_KEY] ??= createRealtimeStore();
  return realtimeGlobal[REALTIME_STORE_KEY];
};

export const __resetRealtimeStoreForTests = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  const realtimeGlobal = globalThis as RealtimeGlobal;
  delete realtimeGlobal[REALTIME_STORE_KEY];
};
