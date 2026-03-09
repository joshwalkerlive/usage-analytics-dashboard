import type { RawSession, DashboardData, DateRange } from "./types";
import { analyzeSession } from "./metrics";
import {
  computeSessionMetrics,
  computeToolUsageStats,
  computeGoalDistribution,
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

  return {
    sessions,
    sessionMetrics,
    toolUsageStats,
    goalDistribution,
    frictionOverTime,
    satisfactionDistribution,
  };
}
