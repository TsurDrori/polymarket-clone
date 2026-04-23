"use client";

import {
  useId,
  useMemo,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { useRetainedLivePrice } from "@/features/realtime/hooks";
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
  tokenId?: string | null;
  bestBid?: number;
  bestAsk?: number;
  dayChange?: number;
  onHoverChange?: (hovered: HeroChartHoverState | null) => void;
};

type OrderFlowTone = "up" | "down" | "neutral";

type OrderFlowParticle = {
  id: string;
  label: string;
  tone: Exclude<OrderFlowTone, "neutral">;
  left: string;
  startTop: string;
  endTop: string;
  delayMs: number;
  durationMs: number;
  fontSizePx: number;
  opacity: number;
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
const ORDER_FLOW_BURST_COUNT = 10;
const ORDER_FLOW_STAGGER_MS = 150;
const ORDER_FLOW_DURATION_MS = 720;

const clampProbability = (value: number): number =>
  Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

const formatBurstDollars = (value: number): string =>
  `${value >= 0 ? "+" : "-"} $${Math.max(1, Math.round(Math.abs(value)))}`;

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

const resolveTrendTone = (
  chart: HeroChartModel | null,
  currentChance: number,
  dayChange?: number,
): Exclude<OrderFlowTone, "neutral"> => {
  if (typeof dayChange === "number" && Math.abs(dayChange) > 0.001) {
    return dayChange >= 0 ? "up" : "down";
  }

  if (chart?.points.length) {
    const anchorPoint =
      chart.points.at(-3)?.p ??
      chart.points[0]?.p ??
      currentChance;
    const currentPoint = chart.points.at(-1)?.p ?? currentChance;

    return currentPoint >= anchorPoint ? "up" : "down";
  }

  return "up";
};

const getFallbackSpread = (
  chart: HeroChartModel | null,
  currentChance: number,
): number => {
  if (!chart || chart.points.length < 2) {
    return 0.012;
  }

  let maxDelta = 0;
  const recentPoints = chart.points.slice(-6);

  for (let index = 1; index < recentPoints.length; index += 1) {
    maxDelta = Math.max(
      maxDelta,
      Math.abs(recentPoints[index]!.p - recentPoints[index - 1]!.p),
    );
  }

  return Math.max(
    0.006,
    Math.min(0.03, maxDelta > 0 ? maxDelta * 1.25 : currentChance * 0.08),
  );
};

const hashSlideKey = (value: string): number => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
};

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

const buildOrderFlowParticles = ({
  chart,
  currentChance,
  bestBid,
  bestAsk,
  dayChange,
  liveTone,
  burstSeed,
}: {
  chart: HeroChartModel | null;
  currentChance: number;
  bestBid: number;
  bestAsk: number;
  dayChange?: number;
  liveTone: Exclude<OrderFlowTone, "neutral">;
  burstSeed: number;
}): OrderFlowParticle[] => {
  const referencePrice = clampProbability(currentChance);
  const fallbackSpread = getFallbackSpread(chart, referencePrice);
  const spread = Math.max(
    0.006,
    Math.min(0.03, Math.abs(bestAsk - bestBid) || fallbackSpread),
  );
  const directionalBias = liveTone === "up" ? 1 : -1;
  const volatility = Math.max(spread * 100, Math.abs((dayChange ?? 0) * 100), 0.9);
  const particleCount = ORDER_FLOW_BURST_COUNT;
  const travelUp = liveTone === "up";
  const laneLeft = "16%";
  const startTop = travelUp ? "92%" : "54%";
  const endTop = travelUp ? "54%" : "92%";
  const durationMs = ORDER_FLOW_DURATION_MS;
  const fontSizePx = 16;
  const opacity = 0.94;

  return Array.from({ length: particleCount }, (_, index) => {
    const seriesIndex = burstSeed * 13 + index * 17;
    const amountMagnitude =
      8 +
      ((seriesIndex * 23) % 330) +
      Math.round(volatility * (0.8 + (seriesIndex % 5) * 0.28));
    const signedAmount = directionalBias * amountMagnitude;

    return {
      id: `particle-${burstSeed}-${index}`,
      label: formatBurstDollars(signedAmount),
      tone: liveTone,
      left: laneLeft,
      startTop,
      endTop,
      delayMs: index * ORDER_FLOW_STAGGER_MS,
      durationMs,
      fontSizePx,
      opacity,
    };
  });
};

function OrderFlowBurst({
  particles,
  tone,
}: {
  particles: OrderFlowParticle[];
  tone: Exclude<OrderFlowTone, "neutral">;
}) {
  if (particles.length === 0) {
    return null;
  }

  return (
    <div
      className={`${styles.orderFlowBackdrop} ${
        tone === "up" ? styles.orderFlowBackdropUp : styles.orderFlowBackdropDown
      }`.trim()}
      aria-hidden="true"
      data-live-order-wave
    >
      {particles.map((particle) => (
        <span
          key={particle.id}
          className={`${styles.orderFlowParticle} ${
            particle.tone === "up"
              ? styles.orderFlowPrintUp
              : styles.orderFlowPrintDown
          }`.trim()}
          style={
            {
              "--order-flow-left": particle.left,
              "--order-flow-start-top": particle.startTop,
              "--order-flow-end-top": particle.endTop,
              "--order-flow-delay": `${particle.delayMs}ms`,
              "--order-flow-duration": `${particle.durationMs}ms`,
              "--order-flow-opacity": particle.opacity,
              "--order-flow-font-size": `${particle.fontSizePx}px`,
            } as CSSProperties
          }
        >
          {particle.label}
        </span>
      ))}
    </div>
  );
}

export function HeroPriceChart({
  chart,
  currentChance,
  tokenId,
  bestBid,
  bestAsk,
  dayChange,
  onHoverChange,
}: HeroPriceChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    point: HeroChartHoverState;
  } | null>(null);
  const { tick } = useRetainedLivePrice(tokenId ?? "");
  const clipPathId = useId();
  const liveChance =
    tick.ts > 0 && tick.price > 0 ? clampProbability(tick.price) : currentChance;
  const orderFlowTone = resolveTrendTone(chart, currentChance, dayChange);
  const orderFlowSlideKey = useMemo(
    () =>
      tokenId ??
      [
        chart?.intervalLabel ?? "spotlight",
        chart?.points[0]?.t ?? "start",
        chart?.points.at(-1)?.t ?? "end",
        currentChance.toFixed(4),
        (dayChange ?? 0).toFixed(4),
      ].join(":"),
    [chart, currentChance, dayChange, tokenId],
  );
  const orderFlowParticles = useMemo(
    () =>
      buildOrderFlowParticles({
        chart,
        currentChance,
        bestBid: clampProbability(bestBid ?? 0),
        bestAsk: clampProbability(bestAsk ?? 0),
        dayChange,
        liveTone: orderFlowTone,
        burstSeed: hashSlideKey(orderFlowSlideKey),
      }),
    [bestAsk, bestBid, chart, currentChance, dayChange, orderFlowSlideKey, orderFlowTone],
  );
  const chartGeometry = useMemo(() => {
    if (!chart || chart.points.length < 5) {
      return null;
    }

    return buildChartPath(chart);
  }, [chart]);

  const orderFlowBackdrop = (
    <OrderFlowBurst
      key={`order-flow-${orderFlowSlideKey}`}
      particles={orderFlowParticles}
      tone={orderFlowTone}
    />
  );

  if (!chartGeometry || !chart) {
    return (
      <div className={styles.chartPanel}>
        <div className={styles.chartFrame}>
          {orderFlowBackdrop}
          <div className={styles.chartFallback}>
            <span className={styles.chartFallbackTitle}>
              History unavailable right now
            </span>
            <span className={styles.chartFallbackCopy}>
              The spotlight still uses the live market price, but the public CLOB
              history feed did not return enough points for a chart.
            </span>
            <span className={styles.chartFallbackTitle}>
              {formatPct(liveChance)} chance
            </span>
          </div>
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
      <figure className={styles.chartFigure}>
        <div className={styles.chartFrame}>
          {orderFlowBackdrop}
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
              <g
                transform={`translate(${hoverLabelX.toFixed(2)} ${hoverLabelY.toFixed(2)})`}
              >
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
                    index === 0
                      ? "start"
                      : index === xTicks.length - 1
                        ? "end"
                        : "middle"
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
        </div>
      </figure>
    </div>
  );
}
