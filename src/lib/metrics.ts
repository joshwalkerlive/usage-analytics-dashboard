import type {
  RawSession,
  AnalyzedSession,
  SessionMetrics,
  ToolUsageStat,
  GoalDistribution,
  GoalCategory,
} from "./types";

const GOAL_KEYWORDS: Record<GoalCategory, string[]> = {
  "bug-fix": ["fix", "bug", "error", "issue", "broken", "crash", "patch"],
  feature: ["add", "feature", "new", "implement", "create", "build"],
  refactor: ["refactor", "clean", "restructure", "reorganize", "improve", "pooling"],
  explore: ["explain", "what", "how", "understand", "explore", "look at", "show"],
  config: ["config", "setup", "install", "configure", "environment"],
  docs: ["doc", "readme", "comment", "documentation"],
  test: ["test", "spec", "coverage", "assert"],
  unknown: [],
};

function classifyGoal(messages: RawSession["messages"]): GoalCategory {
  const firstUserMessage = messages.find((m) => m.role === "user");
  if (!firstUserMessage) return "unknown";
  const text = firstUserMessage.content.toLowerCase();

  for (const [category, keywords] of Object.entries(GOAL_KEYWORDS)) {
    if (category === "unknown") continue;
    if (keywords.some((kw) => text.includes(kw))) {
      return category as GoalCategory;
    }
  }
  return "unknown";
}

export function computeFrictionScore(session: RawSession): number {
  const toolCalls = session.messages.flatMap((m) => m.toolCalls ?? []);
  const totalCalls = toolCalls.length;
  if (totalCalls === 0) return 0;

  const errorCount = toolCalls.filter((tc) => tc.error).length;
  const errorRate = errorCount / totalCalls;

  // Base friction from error rate (0-60 points)
  const errorFriction = errorRate * 60;

  // Message count friction — more back-and-forth = more friction (0-20 points)
  const messageCount = session.messages.length;
  const messageFriction = Math.min((messageCount / 10) * 20, 20);

  // Duration friction — longer sessions relative to tool calls = more friction (0-20 points)
  const avgDurationPerCall = session.durationMs / totalCalls;
  const durationFriction = Math.min((avgDurationPerCall / 300000) * 20, 20);

  return Math.min(Math.round(errorFriction + messageFriction + durationFriction), 100);
}

export function computeSatisfactionScore(session: RawSession): number {
  const toolCalls = session.messages.flatMap((m) => m.toolCalls ?? []);
  const totalCalls = toolCalls.length;
  if (totalCalls === 0) return 75; // neutral for no-tool sessions

  const errorCount = toolCalls.filter((tc) => tc.error).length;
  const errorRate = errorCount / totalCalls;

  // Start at 90, subtract for errors
  const base = 90;
  const errorPenalty = errorRate * 50;

  // Penalty for very long sessions (might indicate struggle)
  const durationPenalty = Math.min(session.durationMs / 1800000 * 10, 10);

  return Math.max(0, Math.min(100, Math.round(base - errorPenalty - durationPenalty)));
}

export function analyzeSession(session: RawSession): AnalyzedSession {
  const toolCalls = session.messages.flatMap((m) => m.toolCalls ?? []);
  const messageCount = session.messages.length;
  const toolCallCount = toolCalls.length;
  const toolErrorCount = toolCalls.filter((tc) => tc.error).length;

  const toolUsage: Record<string, { count: number; errors: number }> = {};
  for (const tc of toolCalls) {
    if (!toolUsage[tc.tool]) {
      toolUsage[tc.tool] = { count: 0, errors: 0 };
    }
    toolUsage[tc.tool].count++;
    if (tc.error) toolUsage[tc.tool].errors++;
  }

  const date = session.timestamp.slice(0, 10);

  return {
    id: session.id,
    date,
    durationMs: session.durationMs,
    messageCount,
    toolCallCount,
    toolErrorCount,
    goalCategory: classifyGoal(session.messages),
    frictionScore: computeFrictionScore(session),
    satisfactionScore: computeSatisfactionScore(session),
    model: session.model,
    toolUsage,
  };
}

export function computeSessionMetrics(sessions: AnalyzedSession[]): SessionMetrics {
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      avgDurationMs: 0,
      sessionsPerDay: {},
      totalMessages: 0,
      totalToolCalls: 0,
    };
  }

  const totalSessions = sessions.length;
  const avgDurationMs =
    sessions.reduce((sum, s) => sum + s.durationMs, 0) / totalSessions;

  const sessionsPerDay: Record<string, number> = {};
  for (const s of sessions) {
    sessionsPerDay[s.date] = (sessionsPerDay[s.date] ?? 0) + 1;
  }

  const totalMessages = sessions.reduce((sum, s) => sum + s.messageCount, 0);
  const totalToolCalls = sessions.reduce((sum, s) => sum + s.toolCallCount, 0);

  return { totalSessions, avgDurationMs, sessionsPerDay, totalMessages, totalToolCalls };
}

export function computeToolUsageStats(sessions: AnalyzedSession[]): ToolUsageStat[] {
  if (sessions.length === 0) return [];

  const aggregate: Record<string, { count: number; errors: number; durations: number[] }> = {};

  for (const session of sessions) {
    for (const [tool, usage] of Object.entries(session.toolUsage)) {
      if (!aggregate[tool]) {
        aggregate[tool] = { count: 0, errors: 0, durations: [] };
      }
      aggregate[tool].count += usage.count;
      aggregate[tool].errors += usage.errors;
    }
  }

  const stats: ToolUsageStat[] = Object.entries(aggregate).map(([tool, data]) => ({
    tool,
    count: data.count,
    errorCount: data.errors,
    errorRate: data.count > 0 ? data.errors / data.count : 0,
    avgDurationMs: 0, // not tracked at aggregate level
  }));

  stats.sort((a, b) => b.count - a.count);
  return stats;
}

export function computeGoalDistribution(sessions: AnalyzedSession[]): GoalDistribution[] {
  if (sessions.length === 0) return [];

  const counts: Record<string, number> = {};
  for (const s of sessions) {
    counts[s.goalCategory] = (counts[s.goalCategory] ?? 0) + 1;
  }

  const total = sessions.length;
  return Object.entries(counts).map(([category, count]) => ({
    category: category as GoalCategory,
    count,
    percentage: (count / total) * 100,
  }));
}
