import { flashAtomFamily, priceAtomFamily, type Tick } from "./atoms";
import { getRealtimeStore } from "./store";

const pendingTicks = new Map<string, Partial<Tick>>();

let frameId: number | null = null;

const canScheduleFrame = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.requestAnimationFrame === "function" &&
  typeof window.cancelAnimationFrame === "function";

const flush = (): void => {
  frameId = null;

  if (pendingTicks.size === 0) {
    return;
  }

  const store = getRealtimeStore();
  const entries = Array.from(pendingTicks.entries());
  pendingTicks.clear();

  for (const [tokenId, partialTick] of entries) {
    const prevTick = store.get(priceAtomFamily(tokenId));
    const nextPrice = partialTick.price ?? prevTick.price;
    const didPriceChange = nextPrice !== prevTick.price;
    const nextTick = {
      ...prevTick,
      ...partialTick,
      prevPrice: didPriceChange ? prevTick.price : prevTick.prevPrice,
      changedAt: didPriceChange ? (partialTick.ts ?? Date.now()) : prevTick.changedAt,
      changeMagnitude: didPriceChange ? Math.abs(nextPrice - prevTick.price) : prevTick.changeMagnitude,
    };

    store.set(priceAtomFamily(tokenId), nextTick);

    if (!didPriceChange) {
      continue;
    }

    const prevFlash = store.get(flashAtomFamily(tokenId));

    store.set(flashAtomFamily(tokenId), {
      seq: prevFlash.seq + 1,
      dir: nextTick.price > prevTick.price ? "up" : "down",
    });
  }
};

const scheduleFlush = (): void => {
  if (frameId !== null || !canScheduleFrame()) {
    return;
  }

  frameId = window.requestAnimationFrame(() => {
    flush();
  });
};

export const enqueue = (tokenId: string, partialTick: Partial<Tick>): void => {
  if (!canScheduleFrame()) {
    return;
  }

  pendingTicks.set(tokenId, partialTick);
  scheduleFlush();
};

export const __resetRafBatcherForTests = (): void => {
  if (frameId !== null && canScheduleFrame()) {
    window.cancelAnimationFrame(frameId);
  }

  frameId = null;
  pendingTicks.clear();
};
