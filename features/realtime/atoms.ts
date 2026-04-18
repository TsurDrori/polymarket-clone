import { atom, type PrimitiveAtom } from "jotai";
import { atomFamily } from "jotai-family";

export type Tick = {
  price: number;
  bestBid: number;
  bestAsk: number;
  ts: number;
};

export type FlashDirection = "up" | "down" | null;

export type FlashState = {
  seq: number;
  dir: FlashDirection;
};

const createEmptyTick = (): Tick => ({
  price: 0,
  bestBid: 0,
  bestAsk: 0,
  ts: 0,
});

const createEmptyFlash = (): FlashState => ({
  seq: 0,
  dir: null,
});

export const priceAtomFamily = atomFamily<string, PrimitiveAtom<Tick>>(() =>
  atom<Tick>(createEmptyTick()),
);

export const flashAtomFamily = atomFamily<string, PrimitiveAtom<FlashState>>(() =>
  atom<FlashState>(createEmptyFlash()),
);

const mountedTokenCounts = new Map<string, number>();

export const retainTokenAtoms = (tokenId: string): void => {
  mountedTokenCounts.set(tokenId, (mountedTokenCounts.get(tokenId) ?? 0) + 1);
};

export const releaseTokenAtoms = (tokenId: string): void => {
  const nextCount = (mountedTokenCounts.get(tokenId) ?? 0) - 1;

  if (nextCount > 0) {
    mountedTokenCounts.set(tokenId, nextCount);
    return;
  }

  mountedTokenCounts.delete(tokenId);
  priceAtomFamily.remove(tokenId);
  flashAtomFamily.remove(tokenId);
};
