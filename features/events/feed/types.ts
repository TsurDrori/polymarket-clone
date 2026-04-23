export type SurfaceFeedLayoutVariant =
  | "feature"
  | "wide"
  | "standard"
  | "compact"
  | "micro";

export type SurfaceFeedMotionPolicy = "static" | "highlight-only" | "bounded-promote";

export type SurfaceFeedDensity = "comfortable" | "compact";

export type SurfaceFeedBreakpoint = "base" | "sm" | "md" | "lg" | "xl";

export type SurfaceFeedSpan = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type SurfaceFeedLayout = Partial<Record<SurfaceFeedBreakpoint, SurfaceFeedSpan>> & {
  density?: SurfaceFeedDensity;
};

export type SurfaceFeedDescriptor = {
  id: string;
  layoutVariant: SurfaceFeedLayoutVariant;
  priority?: number;
  groupKey?: string;
  layout?: SurfaceFeedLayout;
  motionPolicy: SurfaceFeedMotionPolicy;
  motionKey?: string;
  renderVariant: string;
};

export type SurfaceFeedItem<T> = {
  descriptor: SurfaceFeedDescriptor;
  model: T;
};

export type SurfaceFeedContinuation = {
  hasMore: boolean;
  disabled?: boolean;
  label?: string;
  onContinue: () => void;
};

export type SurfaceFeedRenderMeta = {
  descriptor: SurfaceFeedDescriptor;
  index: number;
  isHighlighted: boolean;
  isLiveLeader: boolean;
  leaderIndex: number;
};

type ResolvedSurfaceFeedLayout = {
  density: SurfaceFeedDensity;
  spans: Record<SurfaceFeedBreakpoint, SurfaceFeedSpan>;
};

const SURFACE_FEED_LAYOUT_DEFAULTS: Record<
  SurfaceFeedLayoutVariant,
  ResolvedSurfaceFeedLayout
> = {
  feature: {
    density: "comfortable",
    spans: {
      base: 12,
      sm: 12,
      md: 12,
      lg: 8,
      xl: 8,
    },
  },
  wide: {
    density: "comfortable",
    spans: {
      base: 12,
      sm: 12,
      md: 6,
      lg: 6,
      xl: 6,
    },
  },
  standard: {
    density: "comfortable",
    spans: {
      base: 12,
      sm: 12,
      md: 6,
      lg: 4,
      xl: 3,
    },
  },
  compact: {
    density: "compact",
    spans: {
      base: 12,
      sm: 6,
      md: 4,
      lg: 3,
      xl: 3,
    },
  },
  micro: {
    density: "compact",
    spans: {
      base: 12,
      sm: 6,
      md: 3,
      lg: 3,
      xl: 2,
    },
  },
};

const clampSurfaceFeedSpan = (
  value: number | undefined,
  fallback: SurfaceFeedSpan,
): SurfaceFeedSpan => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  const rounded = Math.floor(value);

  if (rounded < 1) {
    return 1;
  }

  if (rounded > 12) {
    return 12;
  }

  return rounded as SurfaceFeedSpan;
};

export const resolveSurfaceFeedLayout = (
  descriptor: SurfaceFeedDescriptor,
): ResolvedSurfaceFeedLayout => {
  const defaults = SURFACE_FEED_LAYOUT_DEFAULTS[descriptor.layoutVariant];
  const base = clampSurfaceFeedSpan(descriptor.layout?.base, defaults.spans.base);
  const sm = clampSurfaceFeedSpan(
    descriptor.layout?.sm,
    defaults.spans.sm ?? defaults.spans.base,
  );
  const md = clampSurfaceFeedSpan(
    descriptor.layout?.md,
    defaults.spans.md ?? defaults.spans.sm,
  );
  const lg = clampSurfaceFeedSpan(
    descriptor.layout?.lg,
    defaults.spans.lg ?? defaults.spans.md,
  );
  const xl = clampSurfaceFeedSpan(
    descriptor.layout?.xl,
    defaults.spans.xl ?? defaults.spans.lg,
  );

  return {
    density: descriptor.layout?.density ?? defaults.density,
    spans: {
      base,
      sm,
      md,
      lg,
      xl,
    },
  };
};
