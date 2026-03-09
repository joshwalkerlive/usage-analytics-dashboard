import type { AnalyzedSession, DateRange } from "./types";

export function filterByDateRange(
  sessions: AnalyzedSession[],
  range: DateRange
): AnalyzedSession[] {
  return sessions.filter((s) => {
    if (range.start && s.date < range.start) return false;
    if (range.end && s.date > range.end) return false;
    return true;
  });
}
