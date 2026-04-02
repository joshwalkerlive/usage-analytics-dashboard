import type { AnalyticsPayloadV2, SessionMetric } from "@/types/payload-v2";
import type {
  DashboardData,
  AnalyzedSession,
  SessionMetrics,
  ToolUsageStat,
  GoalDistribution,
  FrictionDataPoint,
  SatisfactionDataPoint,
  DailyMetric,
  LanguageStat,
  SessionTypeStat,
  ResponseTimeBucket,
  TimeOfDayBucket,
  ToolErrorStat,
  HelpfulFactorStat,
  OutcomeStat,
  FrictionTypeStat,
  InferredSatisfaction,
  GoalCategory,
} from "./types";
import type { InsightsReport } from "./insights-types";

/**
 * Maps an AnalyticsPayloadV2 to the existing DashboardData interface
 * consumed by all chart components. This is the bridge that lets us
 * keep every chart component unchanged.
 */
export function mapPayloadToDashboardData(
  payload: AnalyticsPayloadV2
): DashboardData {
  const { quantitative: q } = payload;

  const sessions: AnalyzedSession[] = q.sessions.map(mapSessionMetricToAnalyzed);

  const sessionMetrics: SessionMetrics = {
    totalSessions: q.overview.totalSessions,
    avgDurationMs: q.overview.avgSessionDurationMinutes * 60_000,
    sessionsPerDay: Object.fromEntries(
      q.dailyActivity.map((d) => [d.date, d.sessions])
    ),
    totalMessages: q.overview.totalMessages,
    totalToolCalls: q.overview.totalToolCalls,
  };

  const toolUsageStats: ToolUsageStat[] = q.toolUsage.map((t) => ({
    tool: t.name,
    count: t.count,
    errorCount: t.errorCount,
    errorRate: t.errorRate,
    avgDurationMs: (t.avgDurationSeconds ?? 0) * 1000,
  }));

  const totalSessions = q.overview.totalSessions;
  const goalDistribution: GoalDistribution[] = q.goalDistribution.map((g) => ({
    category: mapGoal(g.goal),
    count: g.count,
    percentage: totalSessions > 0 ? Math.round((g.count / totalSessions) * 100) : 0,
  }));

  const frictionOverTime: FrictionDataPoint[] = q.sessions
    .map((s) => ({
      date: s.startTime.slice(0, 10),
      score: s.frictionScore,
      sessionId: s.id,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const satisfactionDistribution: SatisfactionDataPoint[] = q.sessions.map(
    (s) => ({
      score: s.satisfactionScore,
      sessionId: s.id,
      date: s.startTime.slice(0, 10),
    })
  );

  const dailyMetrics: DailyMetric[] = q.dailyActivity.map((d) => ({
    date: d.date,
    sessions: d.sessions,
    messages: d.messages,
    toolCalls: d.toolCalls,
    toolErrors: d.errors,
    avgFriction: computeAvgForDate(q.sessions, d.date, "frictionScore"),
    avgSatisfaction: computeAvgForDate(q.sessions, d.date, "satisfactionScore"),
  }));

  const languageStats: LanguageStat[] = (q.languageStats ?? []).map((l) => ({
    language: l.language,
    fileCount: l.fileCount,
  }));

  const sessionTypeStats: SessionTypeStat[] = (q.sessionTypes ?? []).map((s) => ({
    type: s.type,
    count: s.count,
  }));

  const responseTimeBuckets: ResponseTimeBucket[] =
    q.responseTiming.distribution.map((r) => ({
      range: r.bucket,
      count: r.count,
      medianMs: q.responseTiming.medianSeconds * 1000,
    }));

  const timeOfDayBuckets: TimeOfDayBucket[] = q.timeOfDay.map((t) => ({
    period: t.bucket,
    count: t.count,
    hours: bucketToHours(t.bucket),
  }));

  const toolErrorStats: ToolErrorStat[] = (q.toolErrors?.byCategory ?? []).map((e) => ({
    errorType: e.category,
    count: e.count,
  }));

  const helpfulFactorStats: HelpfulFactorStat[] = q.helpfulFactors.map(
    (h) => ({
      factor: h.factor,
      count: h.count,
    })
  );

  const outcomeStats: OutcomeStat[] = q.outcomes.map((o) => ({
    outcome: o.outcome,
    count: o.count,
  }));

  const frictionTypeStats: FrictionTypeStat[] =
    q.frictionAndSatisfaction.frictionTypes.map((f) => ({
      type: f.type,
      count: f.count,
    }));

  const inferredSatisfaction: InferredSatisfaction[] =
    q.frictionAndSatisfaction.satisfactionBands.map((s) => ({
      level: s.band,
      count: s.count,
    }));

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

/**
 * Maps an AnalyticsPayloadV2 to the existing InsightsReport interface
 * consumed by all narrative/qualitative components.
 */
export function mapPayloadToInsightsReport(
  payload: AnalyticsPayloadV2
): InsightsReport {
  const { qualitative: q, quantitative: quant } = payload;

  return {
    generatedAt: payload.generatedAt,
    dateRange: payload.dateRange,
    sessionCount: payload.counts.sessionCount,

    atAGlance: {
      working: q.atAGlance.workingFactors,
      hindering: q.atAGlance.hinderingFactors,
      quickWins: q.atAGlance.quickWins,
      ambitious: q.atAGlance.ambitiousGoals,
    },

    projectAreas: (quant.projectAreas ?? []).map((p) => ({
      name: p.name,
      sessionCount: p.sessionCount,
      description: p.description,
    })),

    usageNarrative: {
      paragraphs: [q.usagePatterns.style],
      keyInsight: q.usagePatterns.keyInsight ?? q.usagePatterns.style,
    },

    multiClauding: {
      detected: quant.concurrency?.parallelUsageDetected ?? false,
      details: quant.concurrency?.overlappingSessionCount
        ? `${quant.concurrency.overlappingSessionCount} overlapping sessions detected`
        : "No parallel usage detected",
    },

    bigWins: q.bigWins.map((b) => ({
      title: b.title,
      description: b.description,
    })),

    frictionCategories: q.frictionDeepDive.map((f) => ({
      title: f.pattern,
      description: f.suggestion,
      examples: f.exampleSessionRefs ?? [],
    })),

    claudeMdSuggestions: q.recommendations.claudeMdSuggestions.map(
      (s, i) => ({
        id: `cmd-${i}`,
        text: s.text,
      })
    ),

    featureRecommendations: q.recommendations.featureSuggestions.map((f) => ({
      title: f.text,
      description: `Priority: ${f.priority}, Effort: ${f.effort}`,
    })),

    workflowTips: (q.recommendations?.workflowTips ?? []).map((w: any) => ({
      text: w.text,
      priority: w.priority,
      effort: w.effort,
    })),

    usagePatterns: [
      ...q.usagePatterns.strengths.map((s) => ({
        title: "Strength",
        summary: s,
        detail: s,
        prompt: "",
      })),
      ...q.usagePatterns.growthAreas.map((g) => ({
        title: "Growth Area",
        summary: g,
        detail: g,
        prompt: "",
      })),
    ],

    horizonIdeas: (q.onTheHorizon ?? []).map((h) => ({
      title: h.title,
      possible: h.description,
      tip: h.tip ?? "",
      prompt: "",
    })),

    funEnding: {
      headline: "Keep building!",
      detail: `Analyzed ${payload.counts.sessionCount} sessions across ${payload.counts.projectCount} projects.`,
    },
  };
}

// ─── Helpers ────────────────────────────────────────────────

function mapSessionMetricToAnalyzed(s: SessionMetric): AnalyzedSession {
  // Map V2 SessionGoal to GoalCategory
  const goalCategory = mapGoal(s.goal);

  // Build toolUsage record from the session's tool data
  // We don't have per-session tool breakdown in SessionMetric,
  // so provide an empty record (charts use the aggregate toolUsageStats instead)
  const toolUsage: Record<string, { count: number; errors: number }> = {};

  return {
    id: s.id,
    date: s.startTime.slice(0, 10),
    durationMs: s.durationMinutes * 60_000,
    messageCount: s.messageCount,
    toolCallCount: s.toolCallCount,
    toolErrorCount: s.errorCount,
    goalCategory,
    frictionScore: s.frictionScore,
    satisfactionScore: s.satisfactionScore,
    model: s.model,
    toolUsage,
  };
}

/**
 * Maps a V2 SessionGoal string to the GoalCategory type.
 * Unrecognised goals map to "unknown".
 */
function mapGoal(
  goal: string
): GoalCategory {
  const validGoals: GoalCategory[] = [
    "bug-fix",
    "feature",
    "refactor",
    "explore",
    "config",
    "docs",
    "test",
    "analytics",
    "content",
    "plugin",
    "workflow",
    "unknown",
  ];
  return validGoals.includes(goal as GoalCategory)
    ? (goal as GoalCategory)
    : "unknown";
}

function computeAvgForDate(
  sessions: SessionMetric[],
  date: string,
  field: "frictionScore" | "satisfactionScore"
): number {
  const matching = sessions.filter((s) => s.startTime.slice(0, 10) === date);
  if (matching.length === 0) return 0;
  return matching.reduce((sum, s) => sum + s[field], 0) / matching.length;
}

function bucketToHours(bucket: string): number[] {
  switch (bucket) {
    case "morning":
      return [6, 7, 8, 9, 10, 11];
    case "afternoon":
      return [12, 13, 14, 15, 16, 17];
    case "evening":
      return [18, 19, 20, 21];
    case "night":
      return [22, 23, 0, 1, 2, 3, 4, 5];
    default:
      return [];
  }
}
