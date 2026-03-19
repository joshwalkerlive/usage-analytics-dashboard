import type { RawSession, DashboardData, DateRange } from "./types";
import {
  analyzeSession,
  computeSessionMetrics,
  computeToolUsageStats,
  computeGoalDistribution,
  computeLanguageStats,
  computeSessionTypeStats,
  computeResponseTimeBuckets,
  computeTimeOfDayBuckets,
  computeToolErrorStats,
  computeHelpfulFactorStats,
  computeOutcomeStats,
  computeFrictionTypeStats,
  computeInferredSatisfaction,
  computeDailyMetrics,
} from "./metrics";
import { filterByDateRange } from "./filters";

export function buildDashboardData(
  rawSessions: RawSession[],
  dateRange?: DateRange
): DashboardData {
  let sessions = rawSessions.map(analyzeSession);

  if (dateRange) {
    sessions = filterByDateRange(sessions, dateRange);
  }

  // Original computed data
  const sessionMetrics = computeSessionMetrics(sessions);
  const toolUsageStats = computeToolUsageStats(sessions);
  const goalDistribution = computeGoalDistribution(sessions);

  const frictionOverTime = sessions
    .map((s) => ({
      date: s.date,
      score: s.frictionScore,
      sessionId: s.id,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const satisfactionDistribution = sessions.map((s) => ({
    score: s.satisfactionScore,
    sessionId: s.id,
    date: s.date,
  }));

  // Expanded chart data — new computation functions
  const languageStats = computeLanguageStats(sessions, rawSessions);
  const sessionTypeStats = computeSessionTypeStats(sessions);
  const responseTimeBuckets = computeResponseTimeBuckets(rawSessions);
  const timeOfDayBuckets = computeTimeOfDayBuckets(rawSessions);
  const toolErrorStats = computeToolErrorStats(sessions, rawSessions);
  const helpfulFactorStats = computeHelpfulFactorStats(sessions);
  const outcomeStats = computeOutcomeStats(sessions);
  const frictionTypeStats = computeFrictionTypeStats(sessions);
  const inferredSatisfaction = computeInferredSatisfaction(sessions);
  const dailyMetrics = computeDailyMetrics(sessions);

  return {
    sessions,
    sessionMetrics,
    toolUsageStats,
    goalDistribution,
    frictionOverTime,
    satisfactionDistribution,
    dailyMetrics,
    languageStats,
    sessionTypeStats,
    responseTimeBuckets,
    timeOfDayBuckets,
    toolErrorStats,
    helpfulFactorStats,
    outcomeStats,
    frictionTypeStats,
    inferredSatisfaction,
  };
}
