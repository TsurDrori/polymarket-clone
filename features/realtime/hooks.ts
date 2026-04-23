import { useEffect } from "react";
import { useAtomValue } from "jotai";
import {
  flashAtomFamily,
  priceAtomFamily,
  releaseTokenAtoms,
  retainTokenAtoms,
  type FlashState,
  type Tick,
} from "./atoms";
import { subscribe, unsubscribe } from "./subscriptions";

export const useLivePrice = (tokenId: string): Tick =>
  useAtomValue(priceAtomFamily(tokenId));

const useFlash = (tokenId: string): FlashState =>
  useAtomValue(flashAtomFamily(tokenId));

export const useRetainedLivePrice = (
  tokenId: string,
): {
  tick: Tick;
  flash: FlashState;
} => {
  const tick = useLivePrice(tokenId);
  const flash = useFlash(tokenId);

  useEffect(() => {
    retainTokenAtoms(tokenId);
    subscribe([tokenId]);

    return () => {
      unsubscribe([tokenId]);
      releaseTokenAtoms(tokenId);
    };
  }, [tokenId]);

  return {
    tick,
    flash,
  };
};
