import { connect, hasOpenSocket, onOpen, safeSend } from "./ws";

const SUBSCRIPTION_STATE_KEY = "__plaeePolymarketRealtimeSubscriptions__";
const SEND_COALESCE_MS = 50;

type SubscriptionState = {
  refCounts: Map<string, number>;
  sentTokenIds: Set<string>;
  flushTimer: ReturnType<typeof setTimeout> | null;
  removeOpenListener: (() => void) | null;
};

type SubscriptionGlobal = typeof globalThis & {
  [SUBSCRIPTION_STATE_KEY]?: SubscriptionState;
};

const isBrowser = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.setTimeout === "function" &&
  typeof window.clearTimeout === "function";

const createSubscriptionState = (): SubscriptionState => ({
  refCounts: new Map(),
  sentTokenIds: new Set(),
  flushTimer: null,
  removeOpenListener: null,
});

const getState = (): SubscriptionState | null => {
  if (!isBrowser()) {
    return null;
  }

  const subscriptionGlobal = globalThis as SubscriptionGlobal;
  subscriptionGlobal[SUBSCRIPTION_STATE_KEY] ??= createSubscriptionState();
  return subscriptionGlobal[SUBSCRIPTION_STATE_KEY];
};

const getUniqueTokenIds = (tokenIds: ReadonlyArray<string>): string[] => {
  const uniqueTokenIds = new Set<string>();

  for (const tokenId of tokenIds) {
    if (!tokenId) {
      continue;
    }

    uniqueTokenIds.add(tokenId);
  }

  return Array.from(uniqueTokenIds);
};

const getActiveTokenIds = (state: SubscriptionState): string[] =>
  Array.from(state.refCounts.keys());

const replaceSentTokenIds = (
  state: SubscriptionState,
  tokenIds: ReadonlyArray<string>,
): void => {
  state.sentTokenIds = new Set(tokenIds);
};

const ensureOpenListener = (state: SubscriptionState): void => {
  if (state.removeOpenListener !== null) {
    return;
  }

  state.removeOpenListener = onOpen(() => {
    replaceSentTokenIds(state, getActiveTokenIds(state));
  });
};

const flush = (state: SubscriptionState): void => {
  state.flushTimer = null;

  const activeTokenIds = getActiveTokenIds(state);
  connect(() => getActiveTokenIds(state));

  if (!hasOpenSocket()) {
    return;
  }

  const activeSet = new Set(activeTokenIds);
  const subscribeIds = activeTokenIds.filter((tokenId) => !state.sentTokenIds.has(tokenId));
  const unsubscribeIds = Array.from(state.sentTokenIds).filter(
    (tokenId) => !activeSet.has(tokenId),
  );

  if (unsubscribeIds.length > 0) {
    safeSend({
      assets_ids: unsubscribeIds,
      operation: "unsubscribe",
    });
  }

  if (subscribeIds.length > 0) {
    safeSend({
      assets_ids: subscribeIds,
      operation: "subscribe",
    });
  }

  replaceSentTokenIds(state, activeTokenIds);
};

const scheduleFlush = (state: SubscriptionState): void => {
  if (state.flushTimer !== null) {
    return;
  }

  state.flushTimer = setTimeout(() => {
    flush(state);
  }, SEND_COALESCE_MS);
};

export const subscribe = (tokenIds: ReadonlyArray<string>): void => {
  const state = getState();

  if (!state) {
    return;
  }

  ensureOpenListener(state);

  let didChange = false;

  for (const tokenId of getUniqueTokenIds(tokenIds)) {
    const prevCount = state.refCounts.get(tokenId) ?? 0;
    state.refCounts.set(tokenId, prevCount + 1);
    didChange ||= prevCount === 0;
  }

  if (!didChange) {
    return;
  }

  scheduleFlush(state);
};

export const unsubscribe = (tokenIds: ReadonlyArray<string>): void => {
  const state = getState();

  if (!state) {
    return;
  }

  ensureOpenListener(state);

  let didChange = false;

  for (const tokenId of getUniqueTokenIds(tokenIds)) {
    const prevCount = state.refCounts.get(tokenId) ?? 0;

    if (prevCount <= 0) {
      continue;
    }

    if (prevCount === 1) {
      state.refCounts.delete(tokenId);
      didChange = true;
      continue;
    }

    state.refCounts.set(tokenId, prevCount - 1);
  }

  if (!didChange) {
    return;
  }

  scheduleFlush(state);
};

export const __resetSubscriptionsForTests = (): void => {
  if (!isBrowser()) {
    return;
  }

  const subscriptionGlobal = globalThis as SubscriptionGlobal;
  const state = subscriptionGlobal[SUBSCRIPTION_STATE_KEY];

  if (!state) {
    return;
  }

  if (state.flushTimer !== null) {
    clearTimeout(state.flushTimer);
  }

  state.removeOpenListener?.();
  delete subscriptionGlobal[SUBSCRIPTION_STATE_KEY];
};
