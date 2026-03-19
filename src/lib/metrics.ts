import type {
  RawSession,
  AnalyzedSession,
  SessionMetrics,
  ToolUsageStat,
  GoalDistribution,
  GoalCategory,
  LanguageStat,
  SessionTypeStat,
  ResponseTimeBucket,
  TimeOfDayBucket,
  ToolErrorStat,
  HelpfulFactorStat,
  OutcomeStat,
  FrictionTypeStat,
  InferredSatisfaction,
  DailyMetric,
  RawMessage,
  ToolUseBlock,
  ToolResultBlock,
} from "./types";

// --- Content block helpers ---

/** Normalize content to ContentBlock[] — handles string content from the API */
function contentBlocks(msg: RawMessage) {
  if (typeof msg.content === "string") return [{ type: "text" as const, text: msg.content }];
  if (Array.isArray(msg.content)) return msg.content;
  return [{ type: "text" as const, text: String(msg.content) }];
}

function getTextContent(msg: RawMessage): string {
  return contentBlocks(msg)
    .filter((b): b is { type: "text"; text: string } => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

function getToolUses(msg: RawMessage): ToolUseBlock[] {
  // First try native ContentBlock format
  const blocks = contentBlocks(msg).filter((b): b is ToolUseBlock => b.type === "tool_use");
  if (blocks.length > 0) return blocks;

  // Fallback: server JSONL parser puts tool info in toolCalls property
  if (msg.toolCalls && msg.toolCalls.length > 0) {
    return msg.toolCalls.map((tc, i) => ({
      type: "tool_use" as const,
      id: `tc-${i}`,
      name: tc.tool,
      input: tc.args ?? {},
    }));
  }

  return [];
}

function getToolResults(msg: RawMessage): ToolResultBlock[] {
  // First try native ContentBlock format
  const blocks = contentBlocks(msg).filter((b): b is ToolResultBlock => b.type === "tool_result");
  if (blocks.length > 0) return blocks;

  // Fallback: server JSONL parser embeds error info in toolCalls on the
  // preceding assistant message.  The next user message carries the results.
  // To correlate, we look at the toolCalls on this message (if present) and
  // synthesize tool_result blocks for any that have error: true.
  if (msg.toolCalls && msg.toolCalls.length > 0) {
    return msg.toolCalls.map((tc, i) => ({
      type: "tool_result" as const,
      tool_use_id: `tc-${i}`,
      content: "",
      is_error: tc.error === true,
    }));
  }

  return [];
}

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
  const text = getTextContent(firstUserMessage).toLowerCase();

  for (const [category, keywords] of Object.entries(GOAL_KEYWORDS)) {
    if (category === "unknown") continue;
    if (keywords.some((kw) => text.includes(kw))) {
      return category as GoalCategory;
    }
  }
  return "unknown";
}

export function computeFrictionScore(session: RawSession): number {
  const toolUses = session.messages.flatMap((m) => getToolUses(m));
  const totalCalls = toolUses.length;
  if (totalCalls === 0) return 0;

  const toolResults = session.messages.flatMap((m) => getToolResults(m));
  const errorCount = toolResults.filter((r) => r.is_error).length;
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
  const toolUses = session.messages.flatMap((m) => getToolUses(m));
  const totalCalls = toolUses.length;
  if (totalCalls === 0) return 75; // neutral for no-tool sessions

  const toolResults = session.messages.flatMap((m) => getToolResults(m));
  const errorCount = toolResults.filter((r) => r.is_error).length;
  const errorRate = errorCount / totalCalls;

  // Start at 90, subtract for errors
  const base = 90;
  const errorPenalty = errorRate * 50;

  // Penalty for very long sessions (might indicate struggle)
  const durationPenalty = Math.min(session.durationMs / 1800000 * 10, 10);

  return Math.max(0, Math.min(100, Math.round(base - errorPenalty - durationPenalty)));
}

export function analyzeSession(session: RawSession): AnalyzedSession {
  const allToolUses = session.messages.flatMap((m) => getToolUses(m));
  const allToolResults = session.messages.flatMap((m) => getToolResults(m));
  const messageCount = session.messages.length;
  const toolCallCount = allToolUses.length;

  // Build a set of tool_use IDs that had errors
  const errorIds = new Set(
    allToolResults.filter((r) => r.is_error).map((r) => r.tool_use_id)
  );
  const toolErrorCount = errorIds.size;

  const toolUsage: Record<string, { count: number; errors: number }> = {};
  for (const tu of allToolUses) {
    if (!toolUsage[tu.name]) {
      toolUsage[tu.name] = { count: 0, errors: 0 };
    }
    toolUsage[tu.name].count++;
    if (errorIds.has(tu.id)) toolUsage[tu.name].errors++;
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
    model: session.model ?? "unknown",
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

// --- Expanded computation functions ---

const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  ts: "TypeScript",
  tsx: "TypeScript",
  js: "JavaScript",
  jsx: "JavaScript",
  py: "Python",
  rb: "Ruby",
  go: "Go",
  rs: "Rust",
  java: "Java",
  kt: "Kotlin",
  swift: "Swift",
  css: "CSS",
  scss: "CSS",
  html: "HTML",
  json: "JSON",
  yaml: "YAML",
  yml: "YAML",
  md: "Markdown",
  sql: "SQL",
  sh: "Shell",
  bash: "Shell",
  toml: "TOML",
  xml: "XML",
};

export function computeLanguageStats(sessions: AnalyzedSession[], rawSessions: RawSession[]): LanguageStat[] {
  const langCounts: Record<string, number> = {};

  for (const raw of rawSessions) {
    for (const msg of raw.messages) {
      const toolUses = getToolUses(msg);
      if (toolUses.length === 0) continue;
      for (const tu of toolUses) {
        // Extract file paths from tool input
        const input = tu.input as Record<string, unknown>;
        const filePath = (input.file_path ?? input.path ?? input.command ?? "") as string;
        const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
        const lang = EXTENSION_LANGUAGE_MAP[ext];
        if (lang) {
          langCounts[lang] = (langCounts[lang] ?? 0) + 1;
        }
      }
    }
  }

  return Object.entries(langCounts)
    .map(([language, fileCount]) => ({ language, fileCount }))
    .sort((a, b) => b.fileCount - a.fileCount);
}

export function computeSessionTypeStats(sessions: AnalyzedSession[]): SessionTypeStat[] {
  const types: Record<string, number> = {};

  for (const s of sessions) {
    let sessionType: string;
    if (s.messageCount <= 4) {
      sessionType = "Quick Task";
    } else if (s.toolCallCount === 0) {
      sessionType = "Conversation";
    } else if (s.toolCallCount > 20) {
      sessionType = "Deep Work";
    } else if (s.messageCount > 10 && s.toolCallCount > 5) {
      sessionType = "Multi-Step";
    } else {
      sessionType = "Standard";
    }
    types[sessionType] = (types[sessionType] ?? 0) + 1;
  }

  return Object.entries(types)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

export function computeResponseTimeBuckets(rawSessions: RawSession[]): ResponseTimeBucket[] {
  const delays: number[] = [];

  for (const session of rawSessions) {
    const msgs = session.messages;
    for (let i = 1; i < msgs.length; i++) {
      const prev = msgs[i - 1];
      const curr = msgs[i];
      if (prev.role === "assistant" && curr.role === "user" && prev.timestamp && curr.timestamp) {
        const delay = new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime();
        if (delay > 0 && delay < 600000) { // under 10 min — realistic response
          delays.push(delay);
        }
      }
    }
  }

  const buckets: { range: string; min: number; max: number }[] = [
    { range: "< 5s", min: 0, max: 5000 },
    { range: "5–15s", min: 5000, max: 15000 },
    { range: "15–30s", min: 15000, max: 30000 },
    { range: "30s–1m", min: 30000, max: 60000 },
    { range: "1–3m", min: 60000, max: 180000 },
    { range: "3–10m", min: 180000, max: 600000 },
  ];

  return buckets.map(({ range, min, max }) => {
    const inBucket = delays.filter((d) => d >= min && d < max);
    const sorted = [...inBucket].sort((a, b) => a - b);
    const medianMs = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0;
    return { range, count: inBucket.length, medianMs };
  });
}

export function computeTimeOfDayBuckets(rawSessions: RawSession[]): TimeOfDayBucket[] {
  const periodMap: Record<string, { count: number; hours: number[] }> = {
    "Early Morning (5–8)": { count: 0, hours: [] },
    "Morning (8–12)": { count: 0, hours: [] },
    "Afternoon (12–17)": { count: 0, hours: [] },
    "Evening (17–21)": { count: 0, hours: [] },
    "Night (21–5)": { count: 0, hours: [] },
  };

  for (const session of rawSessions) {
    if (!session.timestamp) continue;
    const hour = new Date(session.timestamp).getHours();
    let period: string;
    if (hour >= 5 && hour < 8) period = "Early Morning (5–8)";
    else if (hour >= 8 && hour < 12) period = "Morning (8–12)";
    else if (hour >= 12 && hour < 17) period = "Afternoon (12–17)";
    else if (hour >= 17 && hour < 21) period = "Evening (17–21)";
    else period = "Night (21–5)";

    periodMap[period].count++;
    periodMap[period].hours.push(hour);
  }

  return Object.entries(periodMap).map(([period, data]) => ({
    period,
    count: data.count,
    hours: data.hours,
  }));
}

export function computeToolErrorStats(sessions: AnalyzedSession[], rawSessions: RawSession[]): ToolErrorStat[] {
  const errorTypes: Record<string, number> = {};

  for (const raw of rawSessions) {
    for (const msg of raw.messages) {
      const toolUses = getToolUses(msg);
      const toolResults = getToolResults(msg);
      // Build map from tool_use_id -> tool name
      const nameById = new Map(toolUses.map((tu) => [tu.id, tu.name]));
      for (const tr of toolResults) {
        if (!tr.is_error) continue;
        const tool = (nameById.get(tr.tool_use_id) ?? "unknown").toLowerCase();
        let errorType: string;
        if (tool.includes("bash") || tool.includes("command")) {
          errorType = "Command Failed";
        } else if (tool.includes("read") || tool.includes("write") || tool.includes("edit")) {
          errorType = "File Operation";
        } else {
          errorType = "Tool Error";
        }
        errorTypes[errorType] = (errorTypes[errorType] ?? 0) + 1;
      }
    }
  }

  return Object.entries(errorTypes)
    .map(([errorType, count]) => ({ errorType, count }))
    .sort((a, b) => b.count - a.count);
}

export function computeHelpfulFactorStats(sessions: AnalyzedSession[]): HelpfulFactorStat[] {
  const factors: Record<string, number> = {};

  for (const s of sessions) {
    // Sessions with low friction and high satisfaction signal helpfulness
    if (s.frictionScore < 30 && s.satisfactionScore > 70) {
      factors["Low Friction"] = (factors["Low Friction"] ?? 0) + 1;
    }
    if (s.toolCallCount > 5 && s.toolErrorCount === 0) {
      factors["Error-Free Tools"] = (factors["Error-Free Tools"] ?? 0) + 1;
    }
    if (s.durationMs < 300000 && s.toolCallCount > 3) {
      factors["Fast Completion"] = (factors["Fast Completion"] ?? 0) + 1;
    }
    if (s.messageCount <= 4 && s.toolCallCount > 0) {
      factors["Concise Interaction"] = (factors["Concise Interaction"] ?? 0) + 1;
    }
    if (s.toolCallCount > 10) {
      factors["Deep Automation"] = (factors["Deep Automation"] ?? 0) + 1;
    }
  }

  return Object.entries(factors)
    .map(([factor, count]) => ({ factor, count }))
    .sort((a, b) => b.count - a.count);
}

export function computeOutcomeStats(sessions: AnalyzedSession[]): OutcomeStat[] {
  const outcomes: Record<string, number> = {};

  for (const s of sessions) {
    let outcome: string;
    if (s.satisfactionScore >= 80 && s.frictionScore < 30) {
      outcome = "Smooth Success";
    } else if (s.satisfactionScore >= 60) {
      outcome = "Completed";
    } else if (s.frictionScore > 60) {
      outcome = "High Friction";
    } else if (s.toolErrorCount > 3) {
      outcome = "Error-Heavy";
    } else {
      outcome = "Neutral";
    }
    outcomes[outcome] = (outcomes[outcome] ?? 0) + 1;
  }

  return Object.entries(outcomes)
    .map(([outcome, count]) => ({ outcome, count }))
    .sort((a, b) => b.count - a.count);
}

export function computeFrictionTypeStats(sessions: AnalyzedSession[]): FrictionTypeStat[] {
  const types: Record<string, number> = {};

  for (const s of sessions) {
    if (s.frictionScore < 20) continue; // skip low-friction sessions

    if (s.toolErrorCount > 2) {
      types["Tool Errors"] = (types["Tool Errors"] ?? 0) + 1;
    }
    if (s.messageCount > 15) {
      types["Long Back-and-Forth"] = (types["Long Back-and-Forth"] ?? 0) + 1;
    }
    if (s.durationMs > 600000) {
      types["Extended Duration"] = (types["Extended Duration"] ?? 0) + 1;
    }
    if (s.toolCallCount > 0 && s.toolErrorCount / s.toolCallCount > 0.3) {
      types["High Error Rate"] = (types["High Error Rate"] ?? 0) + 1;
    }
  }

  return Object.entries(types)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

export function computeInferredSatisfaction(sessions: AnalyzedSession[]): InferredSatisfaction[] {
  const levels: Record<string, number> = {
    "Very Satisfied": 0,
    "Satisfied": 0,
    "Neutral": 0,
    "Unsatisfied": 0,
  };

  for (const s of sessions) {
    if (s.satisfactionScore >= 80) levels["Very Satisfied"]++;
    else if (s.satisfactionScore >= 60) levels["Satisfied"]++;
    else if (s.satisfactionScore >= 40) levels["Neutral"]++;
    else levels["Unsatisfied"]++;
  }

  return Object.entries(levels)
    .map(([level, count]) => ({ level, count }))
    .filter((item) => item.count > 0);
}

export function computeDailyMetrics(sessions: AnalyzedSession[]): DailyMetric[] {
  const byDay = new Map<
    string,
    { sessions: number; messages: number; toolCalls: number; toolErrors: number; frictionSum: number; satisfactionSum: number }
  >();

  for (const s of sessions) {
    const day = s.date;
    const existing = byDay.get(day) ?? {
      sessions: 0,
      messages: 0,
      toolCalls: 0,
      toolErrors: 0,
      frictionSum: 0,
      satisfactionSum: 0,
    };
    existing.sessions++;
    existing.messages += s.messageCount;
    existing.toolCalls += s.toolCallCount;
    existing.toolErrors += s.toolErrorCount;
    existing.frictionSum += s.frictionScore;
    existing.satisfactionSum += s.satisfactionScore;
    byDay.set(day, existing);
  }

  return Array.from(byDay.entries())
    .map(([date, d]) => ({
      date,
      sessions: d.sessions,
      messages: d.messages,
      toolCalls: d.toolCalls,
      toolErrors: d.toolErrors,
      avgFriction: Math.round(d.frictionSum / d.sessions),
      avgSatisfaction: Math.round(d.satisfactionSum / d.sessions),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
