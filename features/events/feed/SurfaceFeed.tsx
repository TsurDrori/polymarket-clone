"use client";

import { useMemo } from "react";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { ContinuationButton } from "@/shared/ui/ContinuationButton";
import type {
  SurfaceFeedContinuation,
  SurfaceFeedDensity,
  SurfaceFeedItem,
  SurfaceFeedLayoutVariant,
  SurfaceFeedRenderMeta,
} from "./types";
import { resolveSurfaceFeedLayout } from "./types";
import styles from "./SurfaceFeed.module.css";

type SurfaceFeedProps<T> = {
  items: ReadonlyArray<SurfaceFeedItem<T>>;
  renderItem: (item: SurfaceFeedItem<T>, meta: SurfaceFeedRenderMeta) => ReactNode;
  continuation?: SurfaceFeedContinuation;
  highlightedIds?: ReadonlyArray<string>;
  leaderIds?: ReadonlyArray<string>;
  className?: string;
  gridClassName?: string;
  actionRowClassName?: string;
};

type SurfaceFeedSlotStyle = CSSProperties & {
  "--surface-feed-span-base"?: string;
  "--surface-feed-span-sm"?: string;
  "--surface-feed-span-md"?: string;
  "--surface-feed-span-lg"?: string;
  "--surface-feed-span-xl"?: string;
};

const getVariantClassName = (layoutVariant: SurfaceFeedLayoutVariant): string =>
  ({
    feature: styles.variantFeature,
    wide: styles.variantWide,
    standard: styles.variantStandard,
    compact: styles.variantCompact,
    micro: styles.variantMicro,
  })[layoutVariant];

const getDensityClassName = (density: SurfaceFeedDensity): string =>
  density === "compact" ? styles.densityCompact : styles.densityComfortable;

const toSlotStyle = (
  spans: ReturnType<typeof resolveSurfaceFeedLayout>["spans"],
): SurfaceFeedSlotStyle => ({
  "--surface-feed-span-base": String(spans.base),
  "--surface-feed-span-sm": String(spans.sm),
  "--surface-feed-span-md": String(spans.md),
  "--surface-feed-span-lg": String(spans.lg),
  "--surface-feed-span-xl": String(spans.xl),
});

export function SurfaceFeed<T>({
  items,
  renderItem,
  continuation,
  highlightedIds = [],
  leaderIds = [],
  className,
  gridClassName,
  actionRowClassName,
}: SurfaceFeedProps<T>) {
  const highlightedIdSet = useMemo(() => new Set(highlightedIds), [highlightedIds]);
  const leaderIndexMap = useMemo(
    () => new Map(leaderIds.map((id, index) => [id, index])),
    [leaderIds],
  );

  return (
    <div className={cn(styles.stack, className)}>
      <div className={cn(styles.grid, gridClassName)}>
        {items.map((item, index) => {
          const { descriptor } = item;
          const layout = resolveSurfaceFeedLayout(descriptor);
          const leaderIndex = leaderIndexMap.get(descriptor.id) ?? -1;

          return (
            <div
              key={descriptor.id}
              className={cn(
                styles.slot,
                getVariantClassName(descriptor.layoutVariant),
                getDensityClassName(layout.density),
              )}
              style={toSlotStyle(layout.spans)}
              data-surface-feed-slot="true"
              data-layout-variant={descriptor.layoutVariant}
              data-render-variant={descriptor.renderVariant}
              data-motion-policy={descriptor.motionPolicy}
              data-group-key={descriptor.groupKey}
            >
              {renderItem(item, {
                descriptor,
                index,
                isHighlighted: highlightedIdSet.has(descriptor.id),
                isLiveLeader: leaderIndex >= 0,
                leaderIndex,
              })}
            </div>
          );
        })}
      </div>

      {continuation?.hasMore ? (
        <div className={cn(styles.actionRow, actionRowClassName)}>
          <ContinuationButton onClick={continuation.onContinue}>
            {continuation.label ?? "Show more markets"}
          </ContinuationButton>
        </div>
      ) : null}
    </div>
  );
}
