"use client";

import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { useStore } from "jotai";
import {
  priceAtomFamily,
  releaseTokenAtoms,
  retainTokenAtoms,
  type Tick,
} from "../atoms";
import { subscribe, unsubscribe } from "../subscriptions";
import {
  areIdListsEqual,
  buildProjectedSurfaceWindow,
  clampVisibleCount,
  collectInsertedIds,
  expandVisibleCount,
  getCandidateCount,
  limitVisiblePromotions,
} from "./projection";
import type {
  ProjectableSurfaceItem,
  SurfaceProjectionPolicy,
} from "./types";

type TokenTickReader = (tokenId: string) => Tick;

type UseProjectedSurfaceWindowOptions<T> = {
  items: ReadonlyArray<T>;
  getItemId: (item: T) => string;
  getItemTokenIds: (item: T) => ReadonlyArray<string>;
  getItemLiveScore: (item: T, readTick: TokenTickReader) => number;
  policy: SurfaceProjectionPolicy;
};

type ProjectedSurfaceWindowState<T> = {
  visibleItems: ReadonlyArray<T>;
  visibleIds: ReadonlyArray<string>;
  leaderIds: ReadonlyArray<string>;
  highlightedIds: ReadonlyArray<string>;
  hasMore: boolean;
  showMore: () => void;
};

type SurfaceWindowState = {
  resetKey: string;
  visibleCount: number;
  committedVisibleIds: ReadonlyArray<string>;
  lastReorderAt: number;
  highlightedIds: ReadonlyArray<string>;
};

const EMPTY_TICK: Tick = {
  price: 0,
  bestBid: 0,
  bestAsk: 0,
  ts: 0,
};

const getUniqueTokenIds = (tokenIds: ReadonlyArray<string>): string[] =>
  Array.from(new Set(tokenIds.filter(Boolean)));

const createSurfaceWindowState = (
  resetKey: string,
  itemIds: ReadonlyArray<string>,
  initialVisibleCount: number,
): SurfaceWindowState => ({
  resetKey,
  visibleCount: initialVisibleCount,
  committedVisibleIds: itemIds.slice(0, initialVisibleCount),
  lastReorderAt: 0,
  highlightedIds: [],
});

const resolveSurfaceWindowState = (
  state: SurfaceWindowState,
  resetKey: string,
  itemIds: ReadonlyArray<string>,
  initialVisibleCount: number,
): SurfaceWindowState =>
  state.resetKey === resetKey
    ? state
    : createSurfaceWindowState(resetKey, itemIds, initialVisibleCount);

export function useProjectedSurfaceWindow<T>({
  items,
  getItemId,
  getItemTokenIds,
  getItemLiveScore,
  policy,
}: UseProjectedSurfaceWindowOptions<T>): ProjectedSurfaceWindowState<T> {
  const store = useStore();
  const itemIds = useMemo(() => items.map(getItemId), [items, getItemId]);
  const itemIdsKey = itemIds.join("|");
  const initialVisibleCount = clampVisibleCount(items.length, policy.initialVisibleCount);
  const resetKey = `${itemIdsKey}:${initialVisibleCount}`;
  const [surfaceWindowState, setSurfaceWindowState] = useState<SurfaceWindowState>(() =>
    createSurfaceWindowState(resetKey, itemIds, initialVisibleCount),
  );
  const {
    visibleCount,
    committedVisibleIds,
    highlightedIds,
  } = useMemo(
    () =>
      resolveSurfaceWindowState(
        surfaceWindowState,
        resetKey,
        itemIds,
        initialVisibleCount,
      ),
    [initialVisibleCount, itemIds, resetKey, surfaceWindowState],
  );

  const candidateCount = getCandidateCount(
    items.length,
    visibleCount,
    policy.overscanCount,
  );
  const candidateTokenIds = useMemo(
    () =>
      getUniqueTokenIds(
        items
          .slice(0, candidateCount)
          .flatMap((item) => getItemTokenIds(item)),
      ),
    [candidateCount, getItemTokenIds, items],
  );

  const tokenVersion = useSyncExternalStore(
    useCallback(
      (onStoreChange) => {
        if (candidateTokenIds.length === 0) {
          return () => {};
        }

        candidateTokenIds.forEach((tokenId) => {
          retainTokenAtoms(tokenId);
        });
        subscribe(candidateTokenIds);

        const unsubs = candidateTokenIds.map((tokenId) =>
          store.sub(priceAtomFamily(tokenId), onStoreChange),
        );

        return () => {
          unsubs.forEach((unsub) => {
            unsub();
          });
          unsubscribe(candidateTokenIds);
          candidateTokenIds.forEach((tokenId) => {
            releaseTokenAtoms(tokenId);
          });
        };
      },
      [candidateTokenIds, store],
    ),
    () =>
      candidateTokenIds
        .map((tokenId) => {
          const tick = store.get(priceAtomFamily(tokenId));
          return `${tokenId}:${tick.ts}:${tick.price}`;
        })
        .join("|"),
    () => "",
  );
  const deferredTokenVersion = useDeferredValue(tokenVersion);
  const readTick = useCallback(
    (tokenId: string): Tick => store.get(priceAtomFamily(tokenId)) ?? EMPTY_TICK,
    [store],
  );

  const projectedWindow = useMemo(() => {
    void deferredTokenVersion;

    const projectableItems: ProjectableSurfaceItem[] = items.map((item, baseIndex) => ({
      id: getItemId(item),
      baseIndex,
      liveScore: getItemLiveScore(item, readTick),
    }));

    return buildProjectedSurfaceWindow(projectableItems, {
      visibleCount,
      overscanCount: policy.overscanCount,
    });
  }, [
    deferredTokenVersion,
    getItemId,
    getItemLiveScore,
    items,
    policy.overscanCount,
    readTick,
    visibleCount,
  ]);
  const projectedVisibleIds = projectedWindow.visibleIds;
  const leaderIds = projectedVisibleIds;
  const projectedVisibleIdsKey = projectedVisibleIds.join("|");

  const syncProjectedVisibleIds = useEffectEvent(() => {
    setSurfaceWindowState((previousState) => {
      const currentState = resolveSurfaceWindowState(
        previousState,
        resetKey,
        itemIds,
        initialVisibleCount,
      );

      if (
        projectedVisibleIds.length === 0 ||
        areIdListsEqual(currentState.committedVisibleIds, projectedVisibleIds)
      ) {
        return currentState;
      }

      const now = Date.now();
      const isWindowResize =
        currentState.committedVisibleIds.length !== projectedVisibleIds.length;

      if (
        !isWindowResize &&
        currentState.lastReorderAt > 0 &&
        now - currentState.lastReorderAt < policy.reorderCooldownMs
      ) {
        return currentState;
      }

      const nextVisibleIds = isWindowResize
        ? projectedVisibleIds
        : limitVisiblePromotions({
            previousVisibleIds: currentState.committedVisibleIds,
            projectedVisibleIds,
            maxPromotionsPerCycle: policy.maxPromotionsPerCycle,
          });

      if (areIdListsEqual(currentState.committedVisibleIds, nextVisibleIds)) {
        return currentState;
      }

      return {
        ...currentState,
        committedVisibleIds: nextVisibleIds,
        highlightedIds: collectInsertedIds(currentState.committedVisibleIds, nextVisibleIds),
        lastReorderAt: now,
      };
    });
  });

  useEffect(() => {
    startTransition(() => {
      syncProjectedVisibleIds();
    });
  }, [
    policy.maxPromotionsPerCycle,
    policy.reorderCooldownMs,
    projectedVisibleIdsKey,
    resetKey,
  ]);

  useEffect(() => {
    if (highlightedIds.length === 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSurfaceWindowState((previousState) => {
        const currentState = resolveSurfaceWindowState(
          previousState,
          resetKey,
          itemIds,
          initialVisibleCount,
        );

        if (currentState.highlightedIds.length === 0) {
          return currentState;
        }

        return {
          ...currentState,
          highlightedIds: [],
        };
      });
    }, policy.highlightMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [highlightedIds, initialVisibleCount, itemIds, policy.highlightMs, resetKey]);

  const itemMap = useMemo(
    () => new Map(items.map((item) => [getItemId(item), item])),
    [getItemId, items],
  );
  const visibleItems = useMemo(
    () =>
      committedVisibleIds
        .map((id) => itemMap.get(id))
        .filter((item): item is T => item !== undefined),
    [committedVisibleIds, itemMap],
  );
  const hasMore = visibleCount < items.length;
  const showMore = useCallback(() => {
    startTransition(() => {
      setSurfaceWindowState((previousState) => {
        const currentState = resolveSurfaceWindowState(
          previousState,
          resetKey,
          itemIds,
          initialVisibleCount,
        );

        return {
          ...currentState,
          visibleCount: expandVisibleCount(
            currentState.visibleCount,
            items.length,
            policy.visibleIncrement,
          ),
        };
      });
    });
  }, [initialVisibleCount, itemIds, items.length, policy.visibleIncrement, resetKey]);

  return {
    visibleItems,
    visibleIds: committedVisibleIds,
    leaderIds,
    highlightedIds,
    hasMore,
    showMore,
  };
}
