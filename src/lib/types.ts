// Raw session data as exported from Claude Code
export interface RawToolCall {
  tool: string;
  args: Record<string, unknown>;
  result?: string;
  durationMs?: number;
  error?: boolean;
}

export interface RawMessage {
  role: "user" | "assistant" | "system";
  content: string;
  toolCalls?: RawToolCall[];
  timestamp: string;
}

export interface RawSession {
  id: string;
  timestamp: string;
  durationMs: number;
  messages: RawMessage[];
  model: string;
  cwd: string;
}

// Computed analytics types
export type GoalCategory =
  | "bug-fix"
  | "feature"
  | "refactor"
  | "explore"
  | "config"
  | "docs"
  | "test"
  | "unknown";

export interface ToolUsageStat {
  tool: string;
  count: number;
  errorCount: number;
  errorRate: number;
  avgDurationMs: number;
}

export interface SessionMetrics {
  totalSessions: number;
  avgDurationMs: number;
  sessionsPerDay: Record<string, number>;
  totalMessages: number;
  totalToolCalls: number;
}

export interface GoalDistribution {
  category: GoalCategory;
  count: number;
  percentage: number;
}

export interface FrictionDataPoint {
  date: string;
  score: number;
  sessionId: string;
}

export interface SatisfactionDataPoint {
  score: number;
  sessionId: string;
  date: string;
}

export interface AnalyzedSession {
  id: string;
  date: string;
  durationMs: number;
  messageCount: number;
  toolCallCount: number;
  toolErrorCount: number;
  goalCategory: GoalCategory;
  frictionScore: number;
  satisfactionScore: number;
  model: string;
  toolUsage: Record<string, { count: number; errors: number }>;
}

// New chart data types for expanded dashboard

export interface LanguageStat {
  language: string;
  fileCount: number;
}

export interface SessionTypeStat {
  type: string;
  count: number;
}

export interface ResponseTimeBucket {
  range: string;
  count: number;
  medianMs: number;
}

export interface TimeOfDayBucket {
  period: string;
  count: number;
  hours: number[]; // raw hour values for TZ adjustment
}

export interface ToolErrorStat {
  errorType: string;
  count: number;
}

export interface HelpfulFactorStat {
  factor: string;
  count: number;
}

export interface OutcomeStat {
  outcome: string;
  count: number;
}

export interface FrictionTypeStat {
  type: string;
  count: number;
}

export interface InferredSatisfaction {
  level: string;
  count: number;
}

export interface DashboardData {
  sessions: AnalyzedSession[];
  sessionMetrics: SessionMetrics;
  toolUsageStats: ToolUsageStat[];
  goalDistribution: GoalDistribution[];
  frictionOverTime: FrictionDataPoint[];
  satisfactionDistribution: SatisfactionDataPoint[];
  // Expanded chart data
  languageStats: LanguageStat[];
  sessionTypeStats: SessionTypeStat[];
  responseTimeBuckets: ResponseTimeBucket[];
  timeOfDayBuckets: TimeOfDayBucket[];
  toolErrorStats: ToolErrorStat[];
  helpfulFactorStats: HelpfulFactorStat[];
  outcomeStats: OutcomeStat[];
  frictionTypeStats: FrictionTypeStat[];
  inferredSatisfaction: InferredSatisfaction[];
}

export interface DateRange {
  start: string | null;
  end: string | null;
}
