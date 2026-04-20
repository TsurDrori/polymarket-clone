"use client";

import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
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

const EMPTY_TICK: Tick = {
  price: 0,
  bestBid: 0,
  bestAsk: 0,
  ts: 0,
};

const getUniqueTokenIds = (tokenIds: ReadonlyArray<string>): string[] =>
  Array.from(new Set(tokenIds.filter(Boolean)));

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
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);
  const [committedVisibleIds, setCommittedVisibleIds] = useState<ReadonlyArray<string>>(
    itemIds.slice(0, initialVisibleCount),
  );
  const [lastReorderAt, setLastReorderAt] = useState(0);
  const [highlightedIds, setHighlightedIds] = useState<ReadonlyArray<string>>([]);

  useEffect(() => {
    const nextVisibleCount = clampVisibleCount(items.length, policy.initialVisibleCount);
    setVisibleCount(nextVisibleCount);
    setCommittedVisibleIds(itemIds.slice(0, nextVisibleCount));
    setLastReorderAt(0);
    setHighlightedIds([]);
  }, [itemIds, itemIdsKey, items.length, policy.initialVisibleCount]);

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
  const candidateTokenIdsKey = candidateTokenIds.join("|");

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
      [candidateTokenIds, candidateTokenIdsKey, store],
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

  useEffect(() => {
    if (projectedVisibleIds.length === 0) {
      setCommittedVisibleIds([]);
      setHighlightedIds([]);
      return;
    }

    if (areIdListsEqual(committedVisibleIds, projectedVisibleIds)) {
      return;
    }

    const now = Date.now();
    const isWindowResize = committedVisibleIds.length !== projectedVisibleIds.length;

    if (
      !isWindowResize &&
      lastReorderAt > 0 &&
      now - lastReorderAt < policy.reorderCooldownMs
    ) {
      return;
    }

    const nextVisibleIds = isWindowResize
      ? projectedVisibleIds
      : limitVisiblePromotions({
          previousVisibleIds: committedVisibleIds,
          projectedVisibleIds,
          maxPromotionsPerCycle: policy.maxPromotionsPerCycle,
        });

    if (areIdListsEqual(committedVisibleIds, nextVisibleIds)) {
      return;
    }

    const insertedIds = collectInsertedIds(committedVisibleIds, nextVisibleIds);

    startTransition(() => {
      setCommittedVisibleIds(nextVisibleIds);
      setHighlightedIds(insertedIds);
      setLastReorderAt(now);
    });
  }, [
    committedVisibleIds,
    lastReorderAt,
    policy.maxPromotionsPerCycle,
    policy.reorderCooldownMs,
    projectedVisibleIds,
    projectedVisibleIdsKey,
  ]);

  useEffect(() => {
    if (highlightedIds.length === 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setHighlightedIds([]);
    }, policy.highlightMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [highlightedIds, policy.highlightMs]);

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
      setVisibleCount((currentCount) =>
        expandVisibleCount(currentCount, items.length, policy.visibleIncrement),
      );
    });
  }, [items.length, policy.visibleIncrement]);

  return {
    visibleItems,
    visibleIds: committedVisibleIds,
    leaderIds,
    highlightedIds,
    hasMore,
    showMore,
  };
}
