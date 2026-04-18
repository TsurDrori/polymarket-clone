import { useAtomValue } from "jotai";
import { flashAtomFamily, priceAtomFamily, type FlashState, type Tick } from "./atoms";

export const useLivePrice = (tokenId: string): Tick =>
  useAtomValue(priceAtomFamily(tokenId));

export const useFlash = (tokenId: string): FlashState =>
  useAtomValue(flashAtomFamily(tokenId));
