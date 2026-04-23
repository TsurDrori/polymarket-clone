const LOW_PROBABILITY_RGB = [203, 49, 49] as const;
const MID_PROBABILITY_RGB = [214, 171, 46] as const;
const HIGH_PROBABILITY_RGB = [61, 180, 104] as const;

export const clampProbability = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
};

const interpolateChannel = (start: number, end: number, progress: number): number =>
  Math.round(start + (end - start) * progress);

export const getProbabilityColor = (value: number): string => {
  const clamped = clampProbability(value);
  const [start, end, progress] =
    clamped <= 0.5
      ? [LOW_PROBABILITY_RGB, MID_PROBABILITY_RGB, clamped / 0.5]
      : [MID_PROBABILITY_RGB, HIGH_PROBABILITY_RGB, (clamped - 0.5) / 0.5];

  const rgb = start.map((channel, index) =>
    interpolateChannel(channel, end[index] ?? channel, progress)
  );

  return `rgb(${rgb[0]} ${rgb[1]} ${rgb[2]})`;
};
