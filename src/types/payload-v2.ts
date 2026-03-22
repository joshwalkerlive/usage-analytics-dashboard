// ============================================================
// Enums & Branded Types
// ============================================================

export type Platform = "macos" | "linux" | "windows";

export type SessionGoal =
  | "bug-fix"
  | "feature"
  | "refactor"
  | "explore"
  | "config"
  | "docs"
  | "test"
  | "analytics"
  | "content"
  | "plugin"
  | "workflow"
  | "unknown";

export type SessionType =
  | "quick-task"
  | "deep-work"
  | "multi-step"
  | "standard"
  | "unknown";

export type SessionOutcome =
  | "completed"
  | "smooth"
  | "success"
  | "high-friction"
  | "abandoned"
  | "partial"
  | "unknown";

export type SatisfactionBand =
  | "very-satisfied"
  | "satisfied"
  | "neutral"
  | "frustrated"
  | "unknown";

export type FrictionType =
  | "autonomous-exploration"
  | "environment-config"
  | "premature-action"
  | "resistance-to-correction"
  | "tool-error"
  | "command-failed"
  | "file-operation"
  | "auth"
  | "dependency"
  | "ambiguous-intent"
  | "unknown";

export type HelpfulFactor =
  | "low-friction"
  | "deep-automation"
  | "error-free-tools"
  | "fast-completion"
  | "concise-interaction"
  | "clear-prompting"
  | "good-environment"
  | "skill-reuse"
  | "unknown";

export type ToolErrorCategory =
  | "command-failed"
  | "file-operation"
  | "tool-error"
  | "auth"
  | "config"
  | "dependency"
  | "network"
  | "timeout"
  | "unknown";

export type BigWinImpactType =
  | "time-saved"
  | "quality"
  | "automation"
  | "delivery"
  | "learning"
  | "system-leverage"
  | "other";

export type RecommendationPriority = "high" | "medium" | "low";
export type RecommendationEffort = "low" | "medium" | "high";

export type ClassificationSource = "heuristic" | "ai" | "hybrid";

// ============================================================
// Sub-Interfaces
// ============================================================

export interface SessionMetric {
  id: string;
  project: string; // sanitized project name only, no full paths
  startTime: string; // ISO 8601
  endTime?: string; // ISO 8601
  durationMinutes: number;
  messageCount: number;
  toolCallCount: number;
  errorCount: number;
  correctionCount?: number;
  goal: SessionGoal;
  sessionType: SessionType;
  outcome: SessionOutcome;
  frictionScore: number; // 0-100
  satisfactionScore: number; // 0-100, inferred
  satisfactionBand?: SatisfactionBand;
  frictionTypes: FrictionType[];
  helpfulFactors: HelpfulFactor[];
  hadWrongApproachCorrection?: boolean;
  hadEnvironmentIssue?: boolean;
  hadToolError?: boolean;
  hadAutonomousExplorationIssue?: boolean;
  model: string;
  languageBreakdown?: Array<{
    language: string;
    fileCount: number;
  }>;
  committedCode?: boolean;
  notes?: string[];
  /**
   * Tracks whether this session's categorical fields (goal, outcome, frictionTypes, etc.)
   * were set by deterministic heuristics, AI analysis, or a combination.
   * Used to audit classification quality and improve heuristics over time.
   */
  classificationSource: ClassificationSource;
}

export interface DailyActivityPoint {
  date: string; // YYYY-MM-DD
  sessions: number;
  messages: number;
  toolCalls: number;
  errors: number;
  avgSatisfactionScore?: number; // 0-100
}

export interface GoalMetric {
  goal: SessionGoal;
  count: number;
}

export interface ToolUsageMetric {
  name: string;
  count: number;
  sessionCount: number;
  errorCount: number;
  errorRate: number; // 0.0-1.0 (proportion, NOT percentage)
  avgCallsPerSession: number;
  totalDurationSeconds?: number;
  avgDurationSeconds?: number;
}

export interface LanguageMetric {
  language: string;
  sessionCount: number;
  fileCount: number;
  lineEditCount?: number;
  toolCallCount?: number;
  messageMentions?: number;
}

export interface ProjectAreaMetric {
  name: string;
  description: string;
  sessionCount: number;
  totalMinutes: number;
  percentageOfTime?: number;
  /** Which sanitized project names roll up into this area */
  projects: string[];
}

// ============================================================
// Root Payload
// ============================================================

export interface AnalyticsPayloadV2 {
  version: "2.0";
  generatedAt: string; // ISO 8601
  dateRange: { start: string; end: string };
  platform: Platform;

  /**
   * Raw-input provenance and rollup controls.
   * Important for reconciling discrepancies between dashboard sections.
   */
  source: {
    parserVersion: string;
    aggregationVersion: string;
    timezone: string; // IANA timezone, e.g. "America/New_York"
    dateRangeMode: "inclusive" | "exclusive";
    rawSessionFilesProcessed: number;
    rawMessageRecordsProcessed: number;
    rawToolEventsProcessed: number;
    filtersApplied: string[];
    excludedSessions: Array<{
      id: string;
      reason: string;
    }>;
  };

  /**
   * Health of the dataset and rollups.
   */
  dataQuality: {
    completenessScore: number; // 0-100
    warnings: string[];
    inconsistencies: Array<{
      metric: string;
      details: string;
      severity: "low" | "medium" | "high";
    }>;
    classificationSummary: {
      heuristicCount: number;
      aiCount: number;
      hybridCount: number;
      unknownFieldRate: number; // 0.0-1.0, proportion of fields that remained "unknown"
    };
  };

  counts: {
    sessionCount: number;
    projectCount: number;
  };

  quantitative: {
    overview: {
      totalSessions: number;
      totalMessages: number;
      totalToolCalls: number;
      totalDurationMinutes: number;
      avgSessionDurationMinutes: number;
      avgMessagesPerSession: number;
      avgToolCallsPerSession: number;
      sessionsPerDay?: number;
      avgErrorCountPerSession?: number;
      avgFrictionScore?: number; // 0-100
      avgSatisfactionScore?: number; // 0-100
    };

    sessions: SessionMetric[];

    dailyActivity: DailyActivityPoint[];

    goalDistribution: GoalMetric[];

    goalAchievement: {
      fullyAchieved: number;
      mostlyAchieved: number;
      partiallyAchieved: number;
      failed: number;
      unknown: number;
    };

    sessionTypes: Array<{
      type: SessionType;
      count: number;
    }>;

    toolUsage: ToolUsageMetric[];

    toolErrors: {
      byCategory: Array<{
        category: ToolErrorCategory;
        count: number;
      }>;
      byTool: Array<{
        tool: string;
        errorCount: number;
      }>;
    };

    languageStats: LanguageMetric[];

    timeOfDay: Array<{
      bucket: "morning" | "afternoon" | "evening" | "night";
      count: number;
    }>;

    responseTiming: {
      distribution: Array<{
        bucket: "<5s" | "5-15s" | "15-30s" | "30s-1m" | "1-3m" | "3-10m" | ">10m";
        count: number;
      }>;
      avgSeconds: number;
      medianSeconds: number;
      p90Seconds?: number;
    };

    projectAreas: ProjectAreaMetric[];

    topProjects: Array<{
      name: string;
      sessions: number;
      totalMinutes: number;
    }>;

    outcomes: Array<{
      outcome: SessionOutcome;
      count: number;
    }>;

    helpfulFactors: Array<{
      factor: HelpfulFactor;
      count: number;
    }>;

    frictionAndSatisfaction: {
      avgFrictionScore: number; // 0-100
      avgSatisfactionScore: number; // 0-100
      frictionTypes: Array<{
        type: FrictionType;
        count: number;
      }>;
      satisfactionBands: Array<{
        band: SatisfactionBand;
        count: number;
      }>;
    };

    concurrency: {
      parallelUsageDetected: boolean;
      overlappingSessionCount?: number;
    };
  };

  qualitative: {
    atAGlance: {
      workingFactors: string[];
      hinderingFactors: string[];
      quickWins: string[];
      ambitiousGoals: string[];
    };

    bigWins: Array<{
      title: string;
      description: string;
      sessionRef: string;
      impactType?: BigWinImpactType;
      evidence?: string[];
      estimatedValue?: Array<{
        metric: string;
        value: number;
        unit: string;
      }>;
    }>;

    frictionDeepDive: Array<{
      pattern: string;
      frequency: string;
      suggestion: string;
      relatedFrictionTypes?: FrictionType[];
      exampleSessionRefs?: string[];
    }>;

    usagePatterns: {
      style: string;
      strengths: string[];
      growthAreas: string[];
      keyInsight?: string;
    };

    recommendations: {
      claudeMdSuggestions: Array<{
        text: string;
        priority: RecommendationPriority;
      }>;
      workflowTips: Array<{
        text: string;
        priority: RecommendationPriority;
        effort: RecommendationEffort;
      }>;
      featureSuggestions: Array<{
        text: string;
        priority: RecommendationPriority;
        effort: RecommendationEffort;
      }>;
    };

    onTheHorizon?: Array<{
      title: string;
      description: string;
      tip?: string;
    }>;
  };

  /**
   * Optional supporting artifacts (skill files, hooks, configs)
   * referenced in qualitative narratives.
   */
  artifacts?: Array<{
    type: "skill" | "hook" | "command" | "config" | "report-snippet";
    title: string;
    content: string;
    relatedSessionRef?: string;
  }>;
}
