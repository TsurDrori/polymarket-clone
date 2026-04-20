import type {
  ProjectableSurfaceItem,
  ProjectedSurfaceWindow,
} from "./types";

const compareProjectableItems = (
  left: ProjectableSurfaceItem,
  right: ProjectableSurfaceItem,
): number =>
  right.liveScore - left.liveScore || left.baseIndex - right.baseIndex;

export const clampVisibleCount = (
  totalCount: number,
  requestedCount: number,
): number => {
  if (totalCount <= 0) {
    return 0;
  }

  if (!Number.isFinite(requestedCount) || requestedCount <= 0) {
    return totalCount;
  }

  return Math.min(totalCount, Math.floor(requestedCount));
};

export const expandVisibleCount = (
  currentCount: number,
  totalCount: number,
  incrementCount: number,
): number => {
  if (totalCount <= 0) {
    return 0;
  }

  if (!Number.isFinite(incrementCount) || incrementCount <= 0) {
    return totalCount;
  }

  return Math.min(totalCount, currentCount + Math.floor(incrementCount));
};

export const getCandidateCount = (
  totalCount: number,
  visibleCount: number,
  overscanCount: number,
): number => {
  const normalizedVisibleCount = clampVisibleCount(totalCount, visibleCount);

  if (normalizedVisibleCount === 0) {
    return 0;
  }

  const normalizedOverscan = Number.isFinite(overscanCount)
    ? Math.max(0, Math.floor(overscanCount))
    : 0;

  return Math.min(totalCount, normalizedVisibleCount + normalizedOverscan);
};

export const areIdListsEqual = (
  left: ReadonlyArray<string>,
  right: ReadonlyArray<string>,
): boolean =>
  left.length === right.length && left.every((value, index) => value === right[index]);

export const collectInsertedIds = (
  previousIds: ReadonlyArray<string>,
  nextIds: ReadonlyArray<string>,
): string[] => {
  const previous = new Set(previousIds);
  return nextIds.filter((id) => !previous.has(id));
};

export const limitVisiblePromotions = ({
  previousVisibleIds,
  projectedVisibleIds,
  maxPromotionsPerCycle,
}: {
  previousVisibleIds: ReadonlyArray<string>;
  projectedVisibleIds: ReadonlyArray<string>;
  maxPromotionsPerCycle: number;
}): string[] => {
  if (previousVisibleIds.length !== projectedVisibleIds.length) {
    return [...projectedVisibleIds];
  }

  const cappedPromotions = Number.isFinite(maxPromotionsPerCycle)
    ? Math.max(0, Math.floor(maxPromotionsPerCycle))
    : 0;

  if (cappedPromotions <= 0) {
    return [...previousVisibleIds];
  }

  const previousSet = new Set(previousVisibleIds);
  const projectedSet = new Set(projectedVisibleIds);
  const insertedIds = projectedVisibleIds
    .filter((id) => !previousSet.has(id))
    .slice(0, cappedPromotions);

  if (insertedIds.length === 0) {
    return [...previousVisibleIds];
  }

  const removableIds = previousVisibleIds.filter((id) => !projectedSet.has(id));
  const removedIdSet = new Set(removableIds.slice(-insertedIds.length));
  const insertedIdSet = new Set(insertedIds);
  const nextVisibleIds: string[] = [];

  for (const id of projectedVisibleIds) {
    if (
      insertedIdSet.has(id) ||
      (previousSet.has(id) && !removedIdSet.has(id))
    ) {
      nextVisibleIds.push(id);
    }
  }

  for (const id of previousVisibleIds) {
    if (removedIdSet.has(id) || nextVisibleIds.includes(id)) {
      continue;
    }

    nextVisibleIds.push(id);
  }

  return nextVisibleIds.slice(0, previousVisibleIds.length);
};

export const buildProjectedSurfaceWindow = (
  items: ReadonlyArray<ProjectableSurfaceItem>,
  {
    visibleCount,
    overscanCount,
  }: {
    visibleCount: number;
    overscanCount: number;
  },
): ProjectedSurfaceWindow => {
  const candidateCount = getCandidateCount(items.length, visibleCount, overscanCount);
  const candidateItems = [...items.slice(0, candidateCount)].sort(compareProjectableItems);
  const remainingIds = items
    .slice(candidateCount)
    .sort((left, right) => left.baseIndex - right.baseIndex)
    .map((item) => item.id);

  return {
    candidateIds: candidateItems.map((item) => item.id),
    visibleIds: candidateItems
      .slice(0, clampVisibleCount(candidateItems.length, visibleCount))
      .map((item) => item.id),
    orderedIds: [...candidateItems.map((item) => item.id), ...remainingIds],
  };
};
