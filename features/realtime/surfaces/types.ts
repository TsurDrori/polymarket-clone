export type SurfaceProjectionPolicy = {
  initialVisibleCount: number;
  visibleIncrement: number;
  overscanCount: number;
  maxPromotionsPerCycle: number;
  reorderCooldownMs: number;
  highlightMs: number;
  allowReordering?: boolean;
};

export type ProjectableSurfaceItem = {
  id: string;
  baseIndex: number;
  liveScore: number;
};

export type ProjectedSurfaceWindow = {
  orderedIds: ReadonlyArray<string>;
  candidateIds: ReadonlyArray<string>;
  visibleIds: ReadonlyArray<string>;
  leaderIds: ReadonlyArray<string>;
};

export type SurfaceProjectionCommit = {
  visibleIds: ReadonlyArray<string>;
  highlightedIds: ReadonlyArray<string>;
  didChange: boolean;
  lastReorderAt: number;
};
