const SIMPLE_HEAD_TO_HEAD_SCORE_PATTERN = /^\d{1,3}\s*[-:]\s*\d{1,3}$/;
const ZERO_ONLY_HEAD_TO_HEAD_SCORE_PATTERN = /^0+\s*[-:]\s*0+$/;

const isSimpleHeadToHeadScore = (value: string): boolean =>
  SIMPLE_HEAD_TO_HEAD_SCORE_PATTERN.test(value);

const isZeroOnlyHeadToHeadScore = (value: string): boolean =>
  ZERO_ONLY_HEAD_TO_HEAD_SCORE_PATTERN.test(value);

const normalizeSegment = (value: string): string => value.trim();

export const normalizeSportsScore = (score?: string): string | undefined => {
  if (typeof score !== "string") return undefined;

  const normalizedScore = normalizeSegment(score);
  if (normalizedScore.length === 0) return undefined;

  const segments = normalizedScore
    .split("|")
    .map(normalizeSegment)
    .filter(Boolean);

  if (segments.length > 1) {
    return segments.find(
      (segment) =>
        isSimpleHeadToHeadScore(segment) &&
        !isZeroOnlyHeadToHeadScore(segment),
    );
  }

  if (isZeroOnlyHeadToHeadScore(normalizedScore)) {
    return undefined;
  }

  return normalizedScore;
};

export const parseDisplayedSportsScoreParts = (score?: string): string[] => {
  const normalizedScore = normalizeSportsScore(score);
  if (!normalizedScore || !isSimpleHeadToHeadScore(normalizedScore)) {
    return [];
  }

  return normalizedScore
    .split(/[-:]/)
    .map((value) => value.trim())
    .filter(Boolean);
};
