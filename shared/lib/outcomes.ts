const normalizeOutcomeLabel = (value: string): string => value.trim().toLowerCase();

export const isYesNoOutcomeLabel = (value: string): boolean => {
  const normalized = normalizeOutcomeLabel(value);
  return normalized === "yes" || normalized === "no";
};
