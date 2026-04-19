"use client";

import { useId, useMemo, useState, type PointerEvent } from "react";
import { formatPct } from "@/shared/lib/format";
import type { HeroChartModel } from "../selectors";
import styles from "./HomeHero.module.css";

export type HeroChartHoverState = {
  t: number;
  p: number;
};

type HeroPriceChartProps = {
  chart: HeroChartModel | null;
  currentChance: number;
  onHoverChange?: (hovered: HeroChartHoverState | null) => void;
};

const VIEWBOX_WIDTH = 360;
const VIEWBOX_HEIGHT = 198;
const PADDING = {
  top: 12,
  right: 42,
  bottom: 28,
  left: 8,
};

const Y_TICKS = [0, 0.25, 0.5, 0.75];

const formatChartDate = (timestampSeconds: number): string =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(timestampSeconds * 1000));

const formatHoverDate = (timestampSeconds: number): string =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestampSeconds * 1000));

const buildChartPath = (chart: HeroChartModel) => {
  const xMin = chart.points[0]?.t ?? 0;
  const xMax = chart.points.at(-1)?.t ?? xMin + 1;
  const xSpan = Math.max(1, xMax - xMin);
  const plotWidth = VIEWBOX_WIDTH - PADDING.left - PADDING.right;
  const plotHeight = VIEWBOX_HEIGHT - PADDING.top - PADDING.bottom;

  const xFor = (value: number): number =>
    PADDING.left + ((value - xMin) / xSpan) * plotWidth;
  const yFor = (value: number): number =>
    PADDING.top + (1 - value) * plotHeight;

  const coordinates = chart.points.map((point) => ({
    point,
    x: xFor(point.t),
    y: yFor(point.p),
  }));

  const path = coordinates
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command}${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
    })
    .join(" ");

  const xTicks = [
    chart.points[0],
    chart.points[Math.floor((chart.points.length - 1) / 2)],
    chart.points.at(-1),
  ].filter((point): point is HeroChartModel["points"][number] => Boolean(point));

  return {
    path,
    coordinates,
    xTicks,
    xFor,
    yFor,
    plotWidth,
    plotHeight,
  };
};

const interpolateHoverPoint = (
  coordinates: Array<{
    point: HeroChartModel["points"][number];
    x: number;
    y: number;
  }>,
  targetX: number,
) => {
  const clampedX = Math.max(
    coordinates[0]?.x ?? targetX,
    Math.min(coordinates.at(-1)?.x ?? targetX, targetX),
  );

  const nextIndex = coordinates.findIndex((coordinate) => coordinate.x >= clampedX);
  if (nextIndex <= 0) {
    const first = coordinates[0];
    return {
      x: clampedX,
      y: first.y,
      point: first.point,
    };
  }

  if (nextIndex === -1) {
    const last = coordinates.at(-1);
    return last
      ? {
          x: clampedX,
          y: last.y,
          point: last.point,
        }
      : null;
  }

  const right = coordinates[nextIndex];
  const left = coordinates[nextIndex - 1];
  const span = Math.max(1, right.x - left.x);
  const ratio = Math.max(0, Math.min(1, (clampedX - left.x) / span));
  const t = left.point.t + (right.point.t - left.point.t) * ratio;
  const p = left.point.p + (right.point.p - left.point.p) * ratio;
  const y = left.y + (right.y - left.y) * ratio;

  return {
    x: clampedX,
    y,
    point: { t, p },
  };
};

export function HeroPriceChart({
  chart,
  currentChance,
  onHoverChange,
}: HeroPriceChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    point: HeroChartHoverState;
  } | null>(null);
  const clipPathId = useId();
  const chartGeometry = useMemo(() => {
    if (!chart || chart.points.length < 5) {
      return null;
    }

    return buildChartPath(chart);
  }, [chart]);

  if (!chartGeometry || !chart) {
    return (
      <div className={styles.chartPanel}>
        <div className={styles.chartHeader}>
          <span className={styles.chartLabel}>Price history</span>
          <span className={styles.chartLabel}>Fallback state</span>
        </div>

        <div className={styles.chartFallback}>
          <span className={styles.chartFallbackTitle}>
            History unavailable right now
          </span>
          <span className={styles.chartFallbackCopy}>
            The spotlight still uses the live market price, but the public CLOB
            history feed did not return enough points for a chart.
          </span>
          <span className={styles.chartFallbackTitle}>
            {formatPct(currentChance)} chance
          </span>
        </div>
      </div>
    );
  }

  const { path, coordinates, xTicks, xFor, yFor } = chartGeometry;

  const activeCoordinate =
    hoveredPoint ??
    (coordinates.at(-1)
      ? {
          x: coordinates.at(-1)!.x,
          y: coordinates.at(-1)!.y,
          point: coordinates.at(-1)!.point,
        }
      : null);
  const activePathWidth = activeCoordinate
    ? Math.min(VIEWBOX_WIDTH - PADDING.right, activeCoordinate.x + 1)
    : VIEWBOX_WIDTH - PADDING.right;
  const hoverLabel = hoveredPoint
    ? `Yes ${formatPct(hoveredPoint.point.p)}`
    : null;
  const hoverLabelWidth = hoverLabel ? hoverLabel.length * 6.8 + 16 : 0;
  const hoverLabelX = hoveredPoint
    ? Math.max(
        PADDING.left,
        Math.min(
          hoveredPoint.x - hoverLabelWidth / 2,
          VIEWBOX_WIDTH - PADDING.right - hoverLabelWidth,
        ),
      )
    : 0;
  const hoverLabelY = hoveredPoint
    ? Math.max(PADDING.top + 8, hoveredPoint.y - 18)
    : 0;
  const axisLabel = hoveredPoint
    ? formatHoverDate(hoveredPoint.point.t)
    : null;
  const axisLabelX = hoveredPoint
    ? Math.max(
        PADDING.left,
        Math.min(hoveredPoint.x, VIEWBOX_WIDTH - PADDING.right),
      )
    : 0;

  const updateHoveredPoint = (
    nextHover: { x: number; y: number; point: HeroChartHoverState } | null,
  ) => {
    setHoveredPoint(nextHover);
    onHoverChange?.(nextHover ? nextHover.point : null);
  };

  const handlePointerMove = (event: PointerEvent<SVGRectElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const relativeX = Math.max(
      0,
      Math.min(bounds.width, event.clientX - bounds.left),
    );
    const targetX =
      PADDING.left + (relativeX / Math.max(1, bounds.width)) * chartGeometry.plotWidth;
    const nextHover = interpolateHoverPoint(coordinates, targetX);
    if (!nextHover) {
      updateHoveredPoint(null);
      return;
    }

    if (
      hoveredPoint &&
      Math.abs(hoveredPoint.x - nextHover.x) < 0.5 &&
      Math.abs(hoveredPoint.point.p - nextHover.point.p) < 0.001
    ) {
      return;
    }

    updateHoveredPoint(nextHover);
  };

  return (
    <div className={styles.chartPanel}>
      <div className={styles.chartHeader}>
        <span className={styles.chartLabel}>Price history</span>
        <span className={styles.chartLabel}>
          {hoveredPoint ? formatHoverDate(hoveredPoint.point.t) : chart.intervalLabel}
        </span>
      </div>

      <figure className={styles.chartFigure}>
        <svg
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          className={styles.chartSurface}
          role="img"
          aria-label="Spotlight market price history"
          data-chart-surface
        >
          <defs>
            <clipPath id={clipPathId}>
              <rect
                x="0"
                y="0"
                width={activePathWidth.toFixed(2)}
                height={VIEWBOX_HEIGHT}
              />
            </clipPath>
          </defs>

          {Y_TICKS.map((tick) => {
            const y = yFor(tick);

            return (
              <g key={tick}>
                <line
                  x1={PADDING.left}
                  x2={VIEWBOX_WIDTH - PADDING.right}
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.12"
                  strokeWidth="1"
                />
                <text
                  x={VIEWBOX_WIDTH - PADDING.right + 8}
                  y={y + 4}
                  fill="currentColor"
                  fillOpacity="0.6"
                  fontSize="11"
                >
                  {formatPct(tick)}
                </text>
              </g>
            );
          })}

          <path
            d={path}
            fill="none"
            stroke={hoveredPoint ? "currentColor" : "var(--accent-brand)"}
            strokeOpacity={hoveredPoint ? "0.12" : undefined}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {hoveredPoint ? (
            <path
              d={path}
              fill="none"
              stroke="var(--accent-brand)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              clipPath={`url(#${clipPathId})`}
            />
          ) : null}

          {hoveredPoint ? (
            <line
              x1={hoveredPoint.x}
              x2={hoveredPoint.x}
              y1={PADDING.top}
              y2={VIEWBOX_HEIGHT - PADDING.bottom}
              stroke="currentColor"
              strokeOpacity="0.08"
              strokeWidth="1"
            />
          ) : null}

          {activeCoordinate ? (
            <>
              <circle
                cx={activeCoordinate.x}
                cy={activeCoordinate.y}
                r="8"
                fill="var(--accent-brand-soft)"
              />
              <circle
                cx={activeCoordinate.x}
                cy={activeCoordinate.y}
                r="4"
                fill="var(--accent-brand)"
              />
            </>
          ) : null}

          {hoverLabel && hoveredPoint ? (
            <g transform={`translate(${hoverLabelX.toFixed(2)} ${hoverLabelY.toFixed(2)})`}>
              <rect
                width={hoverLabelWidth.toFixed(2)}
                height="18"
                rx="4"
                fill="var(--accent-brand)"
              />
              <text
                x={hoverLabelWidth / 2}
                y="12"
                fill="white"
                fontSize="11"
                fontWeight="600"
                textAnchor="middle"
              >
                {hoverLabel}
              </text>
            </g>
          ) : null}

          {hoveredPoint && axisLabel ? (
            <text
              x={axisLabelX}
              y={VIEWBOX_HEIGHT - 6}
              textAnchor="middle"
              fill="currentColor"
              fillOpacity="0.6"
              fontSize="11"
            >
              {axisLabel}
            </text>
          ) : (
            xTicks.map((point, index) => (
              <text
                key={`${point.t}-${index}`}
                x={xFor(point.t)}
                y={VIEWBOX_HEIGHT - 6}
                textAnchor={
                  index === 0 ? "start" : index === xTicks.length - 1 ? "end" : "middle"
                }
                fill="currentColor"
                fillOpacity="0.6"
                fontSize="11"
              >
                {formatChartDate(point.t)}
              </text>
            ))
          )}

          <rect
            x={PADDING.left}
            y={PADDING.top}
            width={VIEWBOX_WIDTH - PADDING.left - PADDING.right}
            height={VIEWBOX_HEIGHT - PADDING.top - PADDING.bottom}
            fill="transparent"
            onPointerMove={handlePointerMove}
            onPointerLeave={() => updateHoveredPoint(null)}
          />
        </svg>

        <figcaption className={styles.chartCaption}>
          <span>{chart.sourceLabel}</span>
          <span>{formatPct(currentChance)} latest</span>
        </figcaption>
      </figure>
    </div>
  );
}
