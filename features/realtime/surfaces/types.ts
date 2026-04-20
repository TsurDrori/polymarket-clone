export type SurfaceProjectionPolicy = {
  initialVisibleCount: number;
  visibleIncrement: number;
  overscanCount: number;
  maxPromotionsPerCycle: number;
  reorderCooldownMs: number;
  highlightMs: number;
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
};

export type SurfaceProjectionCommit = {
  visibleIds: ReadonlyArray<string>;
  highlightedIds: ReadonlyArray<string>;
  didChange: boolean;
  lastReorderAt: number;
};
