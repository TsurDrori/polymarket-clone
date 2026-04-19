import { formatPct } from "@/shared/lib/format";
import type { HeroChartModel } from "../selectors";
import styles from "./HomeHero.module.css";

type HeroPriceChartProps = {
  chart: HeroChartModel | null;
  currentChance: number;
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

  const path = chart.points
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command}${xFor(point.t).toFixed(2)} ${yFor(point.p).toFixed(2)}`;
    })
    .join(" ");

  const xTicks = [
    chart.points[0],
    chart.points[Math.floor((chart.points.length - 1) / 2)],
    chart.points.at(-1),
  ].filter((point): point is HeroChartModel["points"][number] => Boolean(point));

  return {
    path,
    xTicks,
    latestPoint: chart.points.at(-1),
    xFor,
    yFor,
    plotWidth,
  };
};

export function HeroPriceChart({
  chart,
  currentChance,
}: HeroPriceChartProps) {
  if (!chart || chart.points.length < 5) {
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

  const { path, xTicks, latestPoint, xFor, yFor } = buildChartPath(chart);

  return (
    <div className={styles.chartPanel}>
      <div className={styles.chartHeader}>
        <span className={styles.chartLabel}>Price history</span>
        <span className={styles.chartLabel}>{chart.intervalLabel}</span>
      </div>

      <figure className={styles.chartFigure}>
        <svg
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          className={styles.chartSurface}
          role="img"
          aria-label="Spotlight market price history"
        >
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
            stroke="var(--accent-brand)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {latestPoint ? (
            <>
              <circle
                cx={xFor(latestPoint.t)}
                cy={yFor(latestPoint.p)}
                r="8"
                fill="var(--accent-brand-soft)"
              />
              <circle
                cx={xFor(latestPoint.t)}
                cy={yFor(latestPoint.p)}
                r="4"
                fill="var(--accent-brand)"
              />
            </>
          ) : null}

          {xTicks.map((point, index) => (
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
          ))}
        </svg>

        <figcaption className={styles.chartCaption}>
          <span>{chart.sourceLabel}</span>
          <span>{formatPct(currentChance)} latest</span>
        </figcaption>
      </figure>
    </div>
  );
}
